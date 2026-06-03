import { syncDataset } from '../services/syncService.js';

/**
 * @desc    Fetch and sync external issue dataset
 * @route   POST /sync
 * @access  Private
 */
export const syncExternalIssues = async (req, res, next) => {
  try {
    const summary = await syncDataset();
    return res.status(200).json({
      success: true,
      message: 'Sync completed successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
