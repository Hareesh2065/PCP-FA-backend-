import express from 'express';
import {
  getIssues,
  searchIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
} from '../controllers/issueController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply JWT protection middleware to all issue routes
router.use(protect);

// GET /issues & POST /issues
router.route('/')
  .get(getIssues)
  .post(createIssue);

// GET /issues/search
router.route('/search')
  .get(searchIssues);

// GET /issues/:id, PUT /issues/:id, DELETE /issues/:id
router.route('/:id')
  .get(getIssueById)
  .put(updateIssue)
  .delete(deleteIssue);

export default router;
