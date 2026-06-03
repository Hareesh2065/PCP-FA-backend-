import express from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all activity log routes
router.use(protect);

router.route('/')
  .get(getActivityLogs);

export default router;
