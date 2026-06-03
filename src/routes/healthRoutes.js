import express from 'express';
import { getHealth } from '../controllers/issueController.js';

const router = express.Router();

// Route: GET /health (Public)
router.get('/', getHealth);

export default router;
