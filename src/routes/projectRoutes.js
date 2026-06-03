import express from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes – only authenticated users can manage projects
router.use(protect);

// GET /projects – list all projects
router.route('/')
  .get(getProjects)
  .post(createProject);

// GET /projects/:id, PUT, DELETE
router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

export default router;
