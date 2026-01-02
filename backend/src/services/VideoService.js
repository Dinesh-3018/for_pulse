const VideoRepository = require("../repositories/VideoRepository");
const { ApiError } = require("../middleware/errorHandler");

class VideoService {
  async uploadVideo(userId, file, title, description, visibility = "private") {
    if (!file) {
      throw new ApiError(400, "Please upload a video file");
    }

    const videoData = {
      userId,
      title: title || file.originalname,
      description,
      fileName: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      format: file.mimetype,
      status: "pending",
      visibility: visibility || "private", // Default to private for security
    };

    return await VideoRepository.create(videoData);
  }

  async getUserVideos(userId, userRole, filters = {}, options = {}) {
    const {
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = options;

    // Build visibility filter based on user role
    let visibilityFilter = {};

    if (userRole === "Viewer") {
      // Viewers can see:
      // 1. Their own videos (any visibility)
      // 2. Public videos from others
      visibilityFilter = {
        $or: [
          { userId: userId }, // Own videos
          { visibility: "public" }, // Public videos
        ],
      };
    }
    // Admin and Editor can see all videos (no additional filter)

    // Build query
    const query = { ...filters, ...visibilityFilter };

    // Add text search if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const videos = await VideoRepository.model
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalVideos = await VideoRepository.model.countDocuments(query);
    const totalPages = Math.ceil(totalVideos / limit);

    return {
      videos,
      currentPage: page,
      totalPages,
      totalVideos,
      limit,
    };
  }

  async getVideoById(userId, videoId, userRole = "Viewer") {
    // Build query based on user role and visibility
    let query = { _id: videoId };

    if (userRole === "Viewer") {
      // Viewers can see:
      // 1. Their own videos (any visibility)
      // 2. Public videos from others
      query.$or = [{ userId: userId }, { visibility: "public" }];
    }
    // Admin and Editor can see all videos (no additional filter)

    const video = await VideoRepository.findOne(query);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    return video;
  }

  async updateVideoStatus(
    videoId,
    status,
    sensitivityStatus,
    progress = 0,
    error = null
  ) {
    // Internal method for processing updates (user isolation handled by ID)
    const updateData = {
      status,
      sensitivityStatus,
      processingProgress: progress,
    };

    if (error) {
      updateData.analysisError = error;
    }

    return await VideoRepository.model.findByIdAndUpdate(videoId, updateData, {
      new: true,
    });
  }

  async updateVideo(videoId, updateData) {
    // Generic update method for any video fields
    return await VideoRepository.model.findByIdAndUpdate(videoId, updateData, {
      new: true,
    });
  }

  async updateVideoWithAnalysis(
    videoId,
    sensitivityStatus,
    confidence,
    detectedLabels,
    details
  ) {
    try {
      // Validate inputs
      if (!videoId) {
        throw new Error("videoId is required");
      }
      if (!sensitivityStatus) {
        throw new Error("sensitivityStatus is required");
      }

      // Ensure sensitivityStatus is valid enum value
      const validStatuses = ["unchecked", "safe", "flagged"];
      if (!validStatuses.includes(sensitivityStatus)) {
        console.error(
          `⚠️  Invalid sensitivityStatus: ${sensitivityStatus}, defaulting to "safe"`
        );
        sensitivityStatus = "safe";
      }

      console.log(`📝 Updating video ${videoId} with analysis:`, {
        status: "completed",
        sensitivityStatus,
        processingProgress: 100,
        analysisConfidence: confidence,
        detectedLabelsCount: detectedLabels?.length || 0,
      });

      // Update video with complete analysis results
      const updatedVideo = await VideoRepository.model.findByIdAndUpdate(
        videoId,
        {
          status: "completed",
          sensitivityStatus,
          processingProgress: 100,
          analysisConfidence: confidence,
          detectedLabels: detectedLabels || [],
          analysisDetails: details || {},
        },
        {
          new: true,
          runValidators: true, // Ensure schema validation runs
        }
      );

      if (!updatedVideo) {
        throw new Error(`Video with ID ${videoId} not found in database`);
      }

      console.log(`✅ Successfully updated video ${videoId} in database`);
      return updatedVideo;
    } catch (error) {
      console.error(
        `❌ Error in updateVideoWithAnalysis for video ${videoId}:`,
        {
          error: error.message,
          stack: error.stack,
          inputs: {
            sensitivityStatus,
            confidence,
            detectedLabelsCount: detectedLabels?.length,
          },
        }
      );
      throw error; // Re-throw to be caught by ProcessingService
    }
  }
}

module.exports = new VideoService();
