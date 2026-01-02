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
/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Super Admin management
 */

/**
 * @swagger
 * /superadmin/dashboard:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get("/dashboard", getDashboardStats);

/**
 * @swagger
 * /superadmin/users:
 *   get:
 *     summary: Get all users
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/users", getAllUsers);

/**
 * @swagger
 * /superadmin/users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/users/:userId", deleteUser);

/**
 * @swagger
 * /superadmin/videos:
 *   get:
 *     summary: Get all videos
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of videos
 */
router.get("/videos", getAllVideos);

/**
 * @swagger
 * /superadmin/videos/{videoId}:
 *   delete:
 *     summary: Delete a video
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted
 */
router.delete("/videos/:videoId", deleteVideo);

/**
 * @swagger
 * /superadmin/quota:
 *   get:
 *     summary: Get quota status
 *     tags: [SuperAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quota status
 */
router.get("/quota", getQuotaStatus);

module.exports = router;
