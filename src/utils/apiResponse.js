/**
 * Sends a successful API response
 * @param {object} res Express response object
 * @param {string} message Description message of operation success
 * @param {object|array} data Payload returned by operation
 * @param {number} statusCode HTTP Status code (default 200)
 */
export const sendSuccess = (res, message = 'Operation successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends a failed API response
 * @param {object} res Express response object
 * @param {string} message Error explanation message
 * @param {number} statusCode HTTP Status code (default 500)
 */
export const sendError = (res, message = 'Internal server error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
