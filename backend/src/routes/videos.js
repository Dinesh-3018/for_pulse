const express = require("express");
const VideoController = require("../controllers/VideoController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  validateVideoUpload,
  validateVideoQuery,
  validateVideoId,
} = require("../middleware/validation");

const router = express.Router();

router.use(protect); // All video routes require auth

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management and analysis
 */

/**
 * @swagger
 * /videos/upload:
 *   post:
 *     summary: Upload a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/upload",
  restrictTo("Editor", "Admin"),
  upload.single("video"),
  validateVideoUpload,
  VideoController.uploadVideo
);

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of videos
 */
router.get("/", validateVideoQuery, VideoController.getVideos);

/**
 * @swagger
 * /videos/stream/{id}:
 *   get:
 *     summary: Stream a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video stream
 *       206:
 *         description: Partial content
 */
router.get("/stream/:id", validateVideoId, VideoController.streamVideo);

/**
 * @swagger
 * /videos/thumbnail/{id}:
 *   get:
 *     summary: Get video thumbnail
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thumbnail image
 */
router.get("/thumbnail/:id", validateVideoId, VideoController.getThumbnail);

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get a specific video details
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details
 */
router.get("/:id", validateVideoId, VideoController.getVideo);

module.exports = router;
