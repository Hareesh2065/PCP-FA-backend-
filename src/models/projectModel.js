import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title too long'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description too long'],
    },
    category: {
      type: String,
      trim: true,
    },
    owner: {
      type: String,
      trim: true,
    },
    members: [{ type: String, trim: true }],
    status: {
      type: String,
      trim: true,
      default: 'active',
    },
    startDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

projectSchema.index({ name: 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;
