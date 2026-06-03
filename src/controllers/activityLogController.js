import ActivityLog from '../models/activityLogModel.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc   Get activity logs (optionally filtered by bug ID)
 * @route  GET /activity-logs
 * @access Private
 */
export const getActivityLogs = async (req, res, next) => {
  try {
    const { bugId } = req.query;
    const filter = {};
    if (bugId) filter.bug = bugId;
    const logs = await ActivityLog.find(filter)
      .populate('performedBy', 'name email')
      .populate('bug', 'title')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 'Activity logs retrieved', logs);
  } catch (err) {
    next(err);
  }
};
