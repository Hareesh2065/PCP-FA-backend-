import Project from '../models/projectModel.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// GET /projects - list all projects (optional name filter)
export const getProjects = async (req, res, next) => {
  try {
    const { name } = req.query;
    const filter = {};
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 'Projects retrieved successfully', projects);
  } catch (error) {
    next(error);
  }
};

// POST /projects - create a new project
export const createProject = async (req, res, next) => {
  try {
    const { name, description, members } = req.body;
    if (!name) {
      return sendError(res, 'Project name is required', 400);
    }
    const newProject = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members,
    });
    return sendSuccess(res, 'Project created successfully', newProject, 201);
  } catch (error) {
    next(error);
  }
};

// GET /projects/:id - fetch a single project
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }
    return sendSuccess(res, 'Project retrieved successfully', project);
  } catch (error) {
    next(error);
  }
};

// PUT /projects/:id - update a project
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const project = await Project.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }
    return sendSuccess(res, 'Project updated successfully', project);
  } catch (error) {
    next(error);
  }
};

// DELETE /projects/:id - remove a project
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }
    return sendSuccess(res, 'Project deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};
