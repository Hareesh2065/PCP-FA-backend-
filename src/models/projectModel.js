import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: [100, 'Name too long'] },
    description: { type: String, trim: true, maxlength: [1000, 'Description too long'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

projectSchema.index({ name: 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;
