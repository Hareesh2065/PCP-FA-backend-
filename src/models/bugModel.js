import mongoose from 'mongoose';



const bugSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'resolved', 'closed'],
        message: 'Status must be: open, in-progress, resolved, or closed',
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
