/**
 * Request Validation Middleware
 * Validates request body fields based on provided rules
 */

/**
 * Validate request body against a schema
 * @param {Object} schema - Validation schema { fieldName: { required, type, min, max, pattern, message } }
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const originalValue = req.body[field];
      const value =
        typeof originalValue === 'string' ? originalValue.trim() : originalValue;

      // Persist sanitized string values so downstream layers receive clean inputs.
      if (typeof originalValue === 'string') {
        req.body[field] = value;
      }

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(rules.message || `${field} is required.`);
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}.`);
      }

      // String length checks
      if (rules.min && typeof value === 'string' && value.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters.`);
      }
      if (rules.max && typeof value === 'string' && value.length > rules.max) {
        errors.push(`${field} must be at most ${rules.max} characters.`);
      }

      // Pattern match
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(rules.patternMessage || `${field} format is invalid.`);
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}.`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors
      });
    }

    next();
  };
};

module.exports = { validate };
