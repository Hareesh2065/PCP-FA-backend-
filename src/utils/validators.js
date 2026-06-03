/**
 * Validates whether the given string is a valid email.
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim().toLowerCase());
};

/**
 * Validates and sanitizes a bug/issue object.
 * @param {object} issue 
 * @returns {object} { isValid: boolean, errors: string[], sanitized: object }
 */
export const validateAndSanitizeBug = (issue) => {
  const errors = [];
  const sanitized = {};

  if (!issue || typeof issue !== 'object') {
    return { isValid: false, errors: ['Invalid issue object format'], sanitized: null };
  }

  // Validate and sanitize Title (Required)
  if (!issue.title || typeof issue.title !== 'string' || !issue.title.trim()) {
    errors.push('Title is required and must be a non-empty string');
  } else {
    sanitized.title = issue.title.trim().substring(0, 100);
  }

  // Sanitize Description (Optional)
  if (issue.description !== undefined && issue.description !== null) {
    sanitized.description = String(issue.description).trim().substring(0, 1000);
  } else {
    sanitized.description = '';
  }

  // Validate Status (Optional, Enum)
  const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
  if (issue.status) {
    const statusLower = String(issue.status).toLowerCase().trim();
    if (validStatuses.includes(statusLower)) {
      sanitized.status = statusLower;
    } else {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  } else {
    sanitized.status = 'open';
  }

  // Validate Priority (Optional, Enum)
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (issue.priority) {
    const priorityLower = String(issue.priority).toLowerCase().trim();
    if (validPriorities.includes(priorityLower)) {
      sanitized.priority = priorityLower;
    } else {
      errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    }
  } else {
    sanitized.priority = 'medium';
  }

  // Sanitize reportedBy (Optional)
  if (issue.reportedBy && typeof issue.reportedBy === 'string' && issue.reportedBy.trim()) {
    sanitized.reportedBy = issue.reportedBy.trim().substring(0, 100);
  } else {
    sanitized.reportedBy = 'Anonymous';
  }

  // Sanitize assignedTo (Optional)
  if (issue.assignedTo && typeof issue.assignedTo === 'string' && issue.assignedTo.trim()) {
    sanitized.assignedTo = issue.assignedTo.trim().substring(0, 100);
  } else {
    sanitized.assignedTo = 'Unassigned';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
};
