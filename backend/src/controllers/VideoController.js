const fs = require("fs");
const VideoService = require("../services/VideoService");
const ProcessingService = require("../services/ProcessingService");
const { ApiError } = require("../middleware/errorHandler");

const uploadVideo = async (req, res, next) => {
  try {
    const { title, description, visibility = "private" } = req.body;

    // Import User model to check upload limit
    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    // Check upload limit
    if (user.uploadCount >= user.uploadLimit) {
      throw new ApiError(
        403,
        `Upload limit reached (${user.uploadCount}/${user.uploadLimit} videos). Cannot upload more videos.`
      );
    }

    const video = await VideoService.uploadVideo(
      req.user.id,
      req.file,
      title,
      description,
      visibility
    );

    // Increment upload count
    user.uploadCount += 1;
    await user.save();

    // Start processing asynchronously
    ProcessingService.processVideo(video);

    res.status(201).json({
      status: "success",
      data: { video },
      uploadCount: user.uploadCount,
      uploadLimit: user.uploadLimit,
    });
  } catch (error) {
    next(error);
  }
};

const getVideos = async (req, res, next) => {
  try {
    const {
      status,
      sensitivity,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
      startDate,
      endDate,
      minSize,
      maxSize,
      minDuration,
      maxDuration,
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (sensitivity) filters.sensitivityStatus = sensitivity;

    // Date range filter
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Size range filter
    if (minSize || maxSize) {
      filters.size = {};
      if (minSize) filters.size.$gte = parseInt(minSize);
      if (maxSize) filters.size.$lte = parseInt(maxSize);
    }

    // Duration range filter
    if (minDuration || maxDuration) {
      filters.duration = {};
      if (minDuration) filters.duration.$gte = parseFloat(minDuration);
      if (maxDuration) filters.duration.$lte = parseFloat(maxDuration);
    }

    const options = {
      search,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = await VideoService.getUserVideos(
      req.user.id,
      req.user.role, // Pass user role for visibility filtering
      filters,
      options
    );

    res.status(200).json({
      status: "success",
      results: result.videos.length,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalVideos: result.totalVideos,
        limit: result.limit,
      },
      data: { videos: result.videos },
    });
  } catch (error) {
    next(error);
  }
};

const getVideo = async (req, res, next) => {
  try {
    const video = await VideoService.getVideoById(
      req.user.id,
      req.params.id,
      req.user.role
    );
    res.status(200).json({
      status: "success",
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

const streamVideo = async (req, res, next) => {
  try {
    const video = await VideoService.getVideoById(
      req.user.id,
      req.params.id,
      req.user.role
    );
    const videoPath = video.path;
    const videoSize = video.size;

    console.log(
      `Streaming video: ID=${video._id}, Path=${videoPath}, Size=${videoSize}, Type=${video.format}`
    );

    if (!fs.existsSync(videoPath)) {
      console.error(`File not found: ${videoPath}`);
      return next(new ApiError(404, "Video file not found on server"));
    }

    // Set CORS headers for video streaming
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range"
    );

    const range = req.headers.range;
    const mimeType = video.format || "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mimeType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": videoSize,
        "Content-Type": mimeType,
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

const getThumbnail = async (req, res, next) => {
  try {
    const video = await VideoService.getVideoById(
      req.user.id,
      req.params.id,
      req.user.role
    );

    if (!video.thumbnail || !fs.existsSync(video.thumbnail)) {
      // Return a default placeholder or 404
      return next(new ApiError(404, "Thumbnail not found"));
    }

    // Set CORS headers for thumbnail
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");

    res.sendFile(video.thumbnail, { root: process.cwd() });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideo,
  streamVideo,
  getThumbnail,
};
