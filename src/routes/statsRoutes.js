import express from 'express';
import { getStats } from '../controllers/issueController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: GET /stats (requires JWT token)
router.get('/', protect, getStats);

export default router;
