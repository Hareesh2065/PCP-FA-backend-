import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    issueId: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'status-changed', 'comment-added', 'assigned'],
    },
    message: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bug',
    },
    details: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ action: 1, performedBy: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
