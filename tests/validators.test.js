import { describe, it, expect } from 'vitest';
import { isValidEmail, validateAndSanitizeBug } from '../src/utils/validators.js';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('admin@example.com')).toBe(true);
      expect(isValidEmail('user.name+label@sub.domain.co')).toBe(true);
    });

    it('should reject incorrect emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateAndSanitizeBug', () => {
    it('should pass and sanitize valid bug payload', () => {
      const payload = {
        title: '  Login button is broken   ',
        description: 'Users cannot login on mobile devices',
        status: 'open',
        priority: 'critical',
        reportedBy: 'User A',
        assignedTo: 'Developer 1',
      };

      const { isValid, errors, sanitized } = validateAndSanitizeBug(payload);

      expect(isValid).toBe(true);
      expect(errors).toHaveLength(0);
      expect(sanitized.title).toBe('Login button is broken');
      expect(sanitized.status).toBe('open');
      expect(sanitized.priority).toBe('critical');
      expect(sanitized.reportedBy).toBe('User A');
      expect(sanitized.assignedTo).toBe('Developer 1');
    });

    it('should fill in defaults for missing optional fields', () => {
      const payload = {
        title: 'New Bug Title',
      };

      const { isValid, errors, sanitized } = validateAndSanitizeBug(payload);

      expect(isValid).toBe(true);
      expect(sanitized.status).toBe('open');
      expect(sanitized.priority).toBe('medium');
      expect(sanitized.reportedBy).toBe('Anonymous');
      expect(sanitized.assignedTo).toBe('Unassigned');
    });

    it('should reject payload with missing title', () => {
      const payload = {
        description: 'Missing title',
        status: 'open',
      };

      const { isValid, errors } = validateAndSanitizeBug(payload);

      expect(isValid).toBe(false);
      expect(errors).toContain('Title is required and must be a non-empty string');
    });

    it('should reject payload with invalid status or priority values', () => {
      const payload = {
        title: 'Bad status/priority bug',
        status: 'pending-approval',
        priority: 'extreme',
      };

      const { isValid, errors } = validateAndSanitizeBug(payload);

      expect(isValid).toBe(false);
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('Status must be one of');
      expect(errors[1]).toContain('Priority must be one of');
    });

    it('should sanitize and truncate overlong titles and descriptions', () => {
      const payload = {
        title: 'a'.repeat(150),
        description: 'b'.repeat(1200),
      };

      const { isValid, sanitized } = validateAndSanitizeBug(payload);

      expect(isValid).toBe(true);
      expect(sanitized.title).toHaveLength(100);
      expect(sanitized.description).toHaveLength(1000);
    });
  });
});
