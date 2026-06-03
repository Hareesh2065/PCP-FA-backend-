import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

const app = express();

// Standard Middlewares
app.use(cors({
  origin: '*', // Allow all origins for simplicity (development/production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Route Bindings
app.use('/auth', authRoutes);
app.use('/issues', issueRoutes);
app.use('/sync', syncRoutes);
app.use('/stats', statsRoutes);
app.use('/projects', projectRoutes);
app.use('/activity-logs', activityLogRoutes);

// Fallback Route for Undefined Endpoints
app.use('*', (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
