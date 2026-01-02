const fs = require("fs");
const User = require("../models/User");
const Video = require("../models/Video");
const { ApiError } = require("../middleware/errorHandler");
const { getInstance: getQuotaService } = require("../services/QuotaService");

/**
 * Middleware to check SuperAdmin role
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== "SuperAdmin") {
    return res.status(403).json({
      error: "SuperAdmin access required",
      yourRole: req.user.role,
    });
  }
  next();
};

/**
 * Get all users with their stats
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    // Add video count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const videoCount = await Video.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          videoCount,
        };
      })
    );

    res.json({
      status: "success",
      count: usersWithStats.length,
      data: { users: usersWithStats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user and all their videos
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Prevent deleting SuperAdmin
    if (user.role === "SuperAdmin") {
      throw new ApiError(403, "Cannot delete SuperAdmin user");
    }

    // Get user's videos to delete files
    const userVideos = await Video.find({ userId });

    // Delete video files from disk
    for (const video of userVideos) {
      try {
        if (fs.existsSync(video.path)) {
          fs.unlinkSync(video.path);
        }
        if (video.thumbnail && fs.existsSync(video.thumbnail)) {
          fs.unlinkSync(video.thumbnail);
        }
      } catch (fileError) {
        console.error(
          `Failed to delete file for video ${video._id}:`,
          fileError.message
        );
      }
    }

    // Delete all user's videos from database
    await Video.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    console.log(
      `✅ SuperAdmin deleted user ${user.email} and ${userVideos.length} videos`
    );

    res.json({
      status: "success",
      message: `User and ${userVideos.length} videos deleted successfully`,
      deletedUser: {
        email: user.email,
        videosDeleted: userVideos.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all videos across all users
 */
const getAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({})
      .populate("userId", "email role")
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      count: videos.length,
      data: { videos },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific video
 */
const deleteVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // Delete files from disk
    try {
      if (fs.existsSync(video.path)) {
        fs.unlinkSync(video.path);
      }
      if (video.thumbnail && fs.existsSync(video.thumbnail)) {
        fs.unlinkSync(video.thumbnail);
      }
    } catch (fileError) {
      console.error(`Failed to delete video files:`, fileError.message);
    }

    // Delete from database
    await Video.findByIdAndDelete(videoId);

    // Decrement user's upload count
    const user = await User.findById(video.userId);
    if (user && user.uploadCount > 0) {
      user.uploadCount -= 1;
      await user.save();
    }

    console.log(`✅ SuperAdmin deleted video ${video.title} (${videoId})`);

    res.json({
      status: "success",
      message: "Video deleted successfully",
      deletedVideo: {
        title: video.title,
        id: videoId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quota status
 */
const getQuotaStatus = async (req, res, next) => {
  try {
    const quotaStatus = await getQuotaService().getQuotaStatus();
    const googleUsers = await getQuotaService().getGoogleUsers();

    res.json({
      status: "success",
      data: {
        quotaStatus,
        googleUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalVideos, quotaStatus, recentUsers, recentVideos] =
      await Promise.all([
        User.countDocuments(),
        Video.countDocuments(),
        getQuotaService().getQuotaStatus(),
        User.find().sort({ createdAt: -1 }).limit(5).select("-password"),
        Video.find()
          .populate("userId", "email")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    const videosByStatus = await Video.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      status: "success",
      data: {
        totalUsers,
        totalVideos,
        quotaStatus,
        videosByStatus,
        recentUsers,
        recentVideos,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireSuperAdmin,
  getAllUsers,
  deleteUser,
  getAllVideos,
  deleteVideo,
  getQuotaStatus,
  getDashboardStats,
};
