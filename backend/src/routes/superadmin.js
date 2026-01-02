const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  requireSuperAdmin,
  getAllUsers,
  deleteUser,
  getAllVideos,
  deleteVideo,
  getQuotaStatus,
  getDashboardStats,
} = require("../controllers/SuperAdminController");

// All routes require authentication + SuperAdmin role
router.use(protect, requireSuperAdmin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);

// Video management
router.get("/videos", getAllVideos);
router.delete("/videos/:videoId", deleteVideo);

// Quota status
router.get("/quota", getQuotaStatus);

module.exports = router;
