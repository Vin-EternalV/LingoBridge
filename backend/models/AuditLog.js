const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  adminName: String,
  action: {
    type: String,
    required: true
  },
  target: String,
  targetId: String,
  details: Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  ipAddress: String
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
