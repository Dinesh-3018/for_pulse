const { body, query, param, validationResult } = require("express-validator");
const { ApiError } = require("./errorHandler");

// Validation middleware to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    throw new ApiError(400, errorMessages);
  }
  next();
};

// Video upload validation
const validateVideoUpload = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  validate,
];

// Video query validation
const validateVideoQuery = [
  query("status")
    .optional()
    .isIn(["pending", "processing", "completed", "failed"])
    .withMessage("Invalid status value"),
  query("sensitivity")
    .optional()
    .isIn(["safe", "flagged", "unchecked"])
    .withMessage("Invalid sensitivity value"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "title", "size", "duration", "analysisConfidence"])
    .withMessage("Invalid sortBy field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be 'asc' or 'desc'"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("minSize")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum size must be a positive number"),
  query("maxSize")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum size must be a positive number"),
  validate,
];

// User registration validation
const validateRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  validate,
];

// User login validation
const validateLogin = [
  body("email").trim().notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// Video ID validation
const validateVideoId = [
  param("id").isMongoId().withMessage("Invalid video ID"),
  validate,
];

module.exports = {
  validate,
  validateVideoUpload,
  validateVideoQuery,
  validateRegistration,
  validateLogin,
  validateVideoId,
};
