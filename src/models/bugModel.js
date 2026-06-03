import mongoose from 'mongoose';



const bugSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    projectId: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'resolved', 'closed', 'testing', 'reopened'],
        message: 'Status must be: open, in-progress, testing, resolved, closed, or reopened',
      },
      default: 'open',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Priority must be: low, medium, high, or critical',
      },
      default: 'medium',
    },
    reportedBy: {
      type: String,
      trim: true,
      default: 'Anonymous',
    },
    assignedTo: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for activity logs
bugSchema.virtual('activityLogs', {
  ref: 'ActivityLog',
  localField: '_id',
  foreignField: 'bug',
});

// Add index on frequently queried fields
bugSchema.index({ status: 1 });
bugSchema.index({ priority: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ title: 'text', description: 'text' });

const Bug = mongoose.model('Bug', bugSchema);
export default Bug;
