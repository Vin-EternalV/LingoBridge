const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// GET /api/admin/support?status=open|in_progress|resolved|closed  (no status = everything)
exports.getSupportTickets = async (req, res, next) => {
  try {
    const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};

    const [tickets, counts] = await Promise.all([
      SupportTicket.find(filter)
        .sort('-updatedAt') // requests with new activity (e.g. a learner reply) come first
        .limit(100)
        .populate('userId', 'firstName lastName email role'),
      SupportTicket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const summary = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    counts.forEach((c) => {
      if (c._id in summary) summary[c._id] = c.count;
    });

    sendSuccess(res, { tickets, summary }, 'Support requests retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/support/:id   body: { status?, reply? }
exports.updateSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 'Invalid support request id.', 400);
    }

    const { status, reply } = req.body;
    if (status === undefined && reply === undefined) {
      return sendError(res, 'Send a status or a reply.', 400);
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return sendError(res, 'Support request not found.', 404);
    }

    const wasClosed = ticket.status === 'closed';

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return sendError(res, 'Status must be open, in_progress, resolved or closed.', 400);
      }
      // A request is closed in two steps: resolve it first, then formally close it.
      if (status === 'closed' && ticket.status !== 'resolved') {
        return sendError(res, 'Mark the request as resolved first, then close it.', 400);
      }
    }

    // A closed request is read-only until an admin reopens it.
    if (wasClosed && status !== 'open') {
      return sendError(res, 'This request is closed. Reopen it first.', 400);
    }

    if (status !== undefined) {
      ticket.status = status;
      if (status === 'closed') {
        ticket.closedAt = new Date();
        ticket.closedBy = req.user.id;
      } else if (wasClosed) {
        ticket.closedAt = undefined;
        ticket.closedBy = undefined;
      }
    }

    if (reply !== undefined) {
      const text = typeof reply === 'string' ? reply.trim() : '';
      if (!text || text.length > 2000) {
        return sendError(res, 'A reply of up to 2,000 characters is required.', 400);
      }
      const admin = await User.findById(req.user.id).select('firstName lastName');
      ticket.replies.push({
        message: text,
        author: req.user.id,
        authorName: admin ? `${admin.firstName} ${admin.lastName}`.trim() : 'Support team',
        from: 'support'
      });
      // Answering an untouched request moves it to "in progress" unless a status was chosen.
      if (status === undefined && ticket.status === 'open') ticket.status = 'in_progress';
    }

    await ticket.save();
    await ticket.populate('userId', 'firstName lastName email role');

    sendSuccess(res, ticket, 'Support request updated');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/support/notifications - requests waiting for an answer:
// brand-new open requests and requests where the learner wrote last.
exports.getSupportNotifications = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ status: { $nin: ['resolved', 'closed'] } })
      .sort('-updatedAt')
      .limit(200)
      .select({ subject: 1, status: 1, userId: 1, createdAt: 1, replies: { $slice: -1 } })
      .populate('userId', 'firstName lastName');

    const items = [];
    tickets.forEach((ticket) => {
      const last = ticket.replies[ticket.replies.length - 1];
      const person = ticket.userId;
      const name = person ? `${person.firstName} ${person.lastName}`.trim() : 'A learner';

      if (!last && ticket.status === 'open') {
        items.push({ ticketId: ticket._id, kind: 'new_request', name, subject: ticket.subject, at: ticket.createdAt });
      } else if (last && last.from === 'learner') {
        items.push({
          ticketId: ticket._id,
          kind: 'learner_reply',
          name,
          subject: ticket.subject,
          preview: String(last.message || '').slice(0, 80),
          at: last.createdAt
        });
      }
    });

    sendSuccess(res, { count: items.length, items: items.slice(0, 10) }, 'Notifications retrieved');
  } catch (err) {
    next(err);
  }
};
