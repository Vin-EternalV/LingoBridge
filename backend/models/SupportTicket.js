const mongoose = require('mongoose');

// The conversation under a request: answers from the support team and follow-ups from the learner.
const replySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: {
    type: String,
    trim: true
  },
  // 'support' = written by an admin, 'learner' = written by the person who opened the request
  from: {
    type: String,
    enum: ['support', 'learner'],
    default: 'support'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['bug', 'account', 'feedback', 'other'],
    default: 'other'
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    // 'closed' = formally finished: the learner can no longer reply, an admin can reopen it.
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  closedAt: {
    type: Date
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // When the learner last opened this request; support replies newer than this count as unread.
  learnerSeenAt: {
    type: Date
  },
  replies: [replySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
