const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const MAX_REPLIES = 100;

exports.createTicket = async (req, res, next) => {
  try {
    const { category, subject, message } = req.body;

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      category,
      subject,
      message
    });

    sendSuccess(res, ticket, 'Support request submitted', 201);
  } catch (err) {
    next(err);
  }
};

exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(20);

    sendSuccess(res, tickets, 'Support requests retrieved');
  } catch (err) {
    next(err);
  }
};

// POST /api/support/:id/replies  { message }  - the learner answers on their own request
exports.replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 'Invalid support request id.', 400);
    }

    const text = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!text || text.length > 2000) {
      return sendError(res, 'A message of up to 2,000 characters is required.', 400);
    }

    // Only the owner can write on a request.
    const ticket = await SupportTicket.findOne({ _id: id, userId: req.user.id });
    if (!ticket) {
      return sendError(res, 'Support request not found.', 404);
    }
    if (ticket.status === 'closed') {
      return sendError(res, 'This request is closed. Please send a new request if you still need help.', 400);
    }
    if (ticket.replies.length >= MAX_REPLIES) {
      return sendError(res, 'This conversation is full. Please open a new request.', 400);
    }

    const person = await User.findById(req.user.id).select('firstName lastName');
    ticket.replies.push({
      message: text,
      author: req.user.id,
      authorName: person ? `${person.firstName} ${person.lastName}`.trim() : 'Learner',
      from: 'learner'
    });
    // A new message on a finished request reopens it so the team sees it.
    if (ticket.status === 'resolved') ticket.status = 'open';

    await ticket.save();
    sendSuccess(res, ticket, 'Reply sent', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/support/notifications - support replies the learner has not opened yet
exports.getNotifications = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id, 'replies.0': { $exists: true } })
      .sort('-updatedAt')
      .limit(50)
      .select({ subject: 1, learnerSeenAt: 1, replies: { $slice: -1 } }); // only the newest reply of each

    const items = [];
    tickets.forEach((ticket) => {
      const last = ticket.replies[ticket.replies.length - 1];
      if (!last || last.from === 'learner') return;
      if (ticket.learnerSeenAt && ticket.learnerSeenAt >= last.createdAt) return;
      items.push({
        ticketId: ticket._id,
        kind: 'reply',
        subject: ticket.subject,
        preview: String(last.message || '').slice(0, 80),
        at: last.createdAt
      });
    });
    items.sort((a, b) => new Date(b.at) - new Date(a.at));

    sendSuccess(res, { count: items.length, items: items.slice(0, 10) }, 'Notifications retrieved');
  } catch (err) {
    next(err);
  }
};

// POST /api/support/:id/seen - the learner opened the request
exports.markSeen = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 'Invalid support request id.', 400);
    }
    // timestamps:false keeps "updatedAt" (used to sort the admin list) untouched by a mere read.
    await SupportTicket.updateOne(
      { _id: id, userId: req.user.id },
      { $set: { learnerSeenAt: new Date() } },
      { timestamps: false }
    );
    sendSuccess(res, {}, 'Marked as read');
  } catch (err) {
    next(err);
  }
};
