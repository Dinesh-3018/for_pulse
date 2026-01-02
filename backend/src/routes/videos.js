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

router.post(
  "/upload",
  restrictTo("Editor", "Admin"),
  upload.single("video"),
  validateVideoUpload,
  VideoController.uploadVideo
);

router.get("/", validateVideoQuery, VideoController.getVideos);
router.get("/stream/:id", validateVideoId, VideoController.streamVideo);
router.get("/thumbnail/:id", validateVideoId, VideoController.getThumbnail);
router.get("/:id", validateVideoId, VideoController.getVideo);

module.exports = router;
