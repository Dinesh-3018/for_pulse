const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String, // Path to thumbnail image
    },
    size: Number,
    format: String,
    duration: Number,
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    sensitivityStatus: {
      type: String,
      enum: ["unchecked", "safe", "flagged"],
      default: "unchecked",
    },
    processingProgress: {
      type: Number,
      default: 0,
    },
    analysisConfidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    detectedLabels: {
      type: [String],
      default: [],
    },
    analysisDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    analysisError: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private", // Default to private for security
    },
  },
  {
    timestamps: true,
  }
);

// Index for multi-tenant performance and filtering
videoSchema.index({ userId: 1, status: 1 });
videoSchema.index({ userId: 1, sensitivityStatus: 1 });
videoSchema.index({ visibility: 1 }); // Index for visibility filtering
videoSchema.index({ title: "text", description: "text" }); // Text search index

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
