import express from 'express';
import { syncExternalIssues } from '../controllers/syncController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: POST /sync (requires JWT token)
router.post('/', protect, syncExternalIssues);

export default router;
