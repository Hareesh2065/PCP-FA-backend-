import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'updated', 'status-changed', 'comment-added', 'assigned'],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bug: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug', required: true },
    details: { type: String, trim: true },
  },
  { timestamps: true }
);

activityLogSchema.index({ action: 1, performedBy: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
