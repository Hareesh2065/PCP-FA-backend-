import Bug from '../models/bugModel.js';
import mongoose from 'mongoose';
import ActivityLog from '../models/activityLogModel.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateAndSanitizeBug } from '../utils/validators.js';

/**
 * @desc    Get all issues (with filtering and search)
 * @route   GET /issues
 * @access  Private
 */
export const getIssues = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, q } = req.query;

    const queryObj = {};

    if (status) {
      queryObj.status = status.trim().toLowerCase();
    }

    if (priority) {
      queryObj.priority = priority.trim().toLowerCase();
    }

    if (assignedTo) {
      queryObj.assignedTo = assignedTo.trim();
    }

    if (q) {
      const searchRegex = new RegExp(q.trim(), 'i');
      queryObj.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    const issues = await Bug.find(queryObj).sort({ updatedAt: -1 });

    return sendSuccess(res, 'Issues retrieved successfully', issues);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get search issues specifically (as defined in requirements: GET /issues/search?q=login)
 * @route   GET /issues/search
 * @access  Private
 */
export const searchIssues = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return sendSuccess(res, 'No search term provided', []);
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const issues = await Bug.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    }).sort({ updatedAt: -1 });

    return sendSuccess(res, 'Search results retrieved successfully', issues);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single issue by ID
 * @route   GET /issues/:id
 * @access  Private
 */
export const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid Issue ID format', 400);
    }

    const bug = await Bug.findById(id);
    if (!bug) {
      return sendError(res, 'Issue not found', 404);
    }

    return sendSuccess(res, 'Issue retrieved successfully', bug);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new issue
 * @route   POST /issues
 * @access  Private
 */
export const createIssue = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateAndSanitizeBug(req.body);

    if (!isValid) {
      return sendError(res, errors.join('. '), 400);
    }

    // Set reportedBy to logged in user if not specified
    if (sanitized.reportedBy === 'Anonymous' && req.user && req.user.name) {
      sanitized.reportedBy = req.user.name;
    }

    const newBug = await Bug.create(sanitized);

    // Log creation activity
    await ActivityLog.create({
      action: 'created',
      performedBy: req.user._id,
      bug: newBug._id,
      details: 'Issue created',
    });

    return sendSuccess(res, 'Issue created successfully', newBug, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update issue
 * @route   PUT /issues/:id
 * @access  Private
 */
export const updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid Issue ID format', 400);
    }

    const bug = await Bug.findById(id);
    if (!bug) {
      return sendError(res, 'Issue not found', 404);
    }

    // Validate and sanitize update payload (we merge with existing and revalidate)
    const updatePayload = {
      title: req.body.title !== undefined ? req.body.title : bug.title,
      description: req.body.description !== undefined ? req.body.description : bug.description,
      status: req.body.status !== undefined ? req.body.status : bug.status,
      priority: req.body.priority !== undefined ? req.body.priority : bug.priority,
      reportedBy: req.body.reportedBy !== undefined ? req.body.reportedBy : bug.reportedBy,
      assignedTo: req.body.assignedTo !== undefined ? req.body.assignedTo : bug.assignedTo,
    };

    const { isValid, errors, sanitized } = validateAndSanitizeBug(updatePayload);

    if (!isValid) {
      return sendError(res, errors.join('. '), 400);
    }

    const updatedBug = await Bug.findByIdAndUpdate(id, sanitized, {
      new: true,
      runValidators: true,
    });

    // Activity logging for changes
    const logs = [];
    if (bug.status !== updatedBug.status) {
      logs.push({
        action: 'status-changed',
        details: `Status changed from ${bug.status} to ${updatedBug.status}`,
      });
    }
    if (bug.assignedTo !== updatedBug.assignedTo) {
      logs.push({
        action: 'assigned',
        details: `Assignment changed from ${bug.assignedTo} to ${updatedBug.assignedTo}`,
      });
    }
    if (logs.length > 0) {
      await Promise.all(
        logs.map((log) =>
          ActivityLog.create({
            action: log.action,
            performedBy: req.user._id,
            bug: updatedBug._id,
            details: log.details,
          })
        )
      );
    }

    return sendSuccess(res, 'Issue updated successfully', updatedBug);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete issue
 * @route   DELETE /issues/:id
 * @access  Private
 */
export const deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid Issue ID format', 400);
    }

    const bug = await Bug.findByIdAndDelete(id);
    if (!bug) {
      return sendError(res, 'Issue not found', 404);
    }

    // Log deletion activity
    await ActivityLog.create({
      action: 'deleted',
      performedBy: req.user._id,
      bug: bug._id,
      details: 'Issue deleted',
    });

    return sendSuccess(res, 'Issue deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate issue stats
 * @route   GET /stats
 * @access  Private
 */
export const getStats = async (req, res, next) => {
  try {
    const totalIssues = await Bug.countDocuments();
    const open = await Bug.countDocuments({ status: 'open' });
    const inProgress = await Bug.countDocuments({ status: 'in-progress' });
    const resolved = await Bug.countDocuments({ status: 'resolved' });
    const closed = await Bug.countDocuments({ status: 'closed' });
    const critical = await Bug.countDocuments({ priority: 'critical' });
    const high = await Bug.countDocuments({ priority: 'high' });
    const medium = await Bug.countDocuments({ priority: 'medium' });
    const low = await Bug.countDocuments({ priority: 'low' });

    // Format matches exactly the requested format
    const stats = {
      totalIssues,
      open,
      inProgress,
      resolved,
      closed,
      critical,
      high,
      medium,
      low,
    };

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check health of database and document counts
 * @route   GET /health
 * @access  Public
 */
export const getHealth = async (req, res, next) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const documentCount = isConnected ? await Bug.countDocuments() : 0;

    return res.status(200).json({
      success: true,
      database: isConnected ? 'connected' : 'disconnected',
      documentCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      database: 'disconnected',
      error: error.message,
    });
  }
};
