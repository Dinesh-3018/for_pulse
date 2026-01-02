const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const VideoService = require("./VideoService");
const SocketService = require("./SocketService");
const User = require("../models/User");
const {
  getInstance: getSensitivityAnalysisService,
} = require("./SensitivityAnalysisService");
const {
  getInstance: getGoogleVideoAnalyzer,
} = require("./GoogleVideoAnalyzer");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;

// Set the ffmpeg and ffprobe paths strictly
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

class ProcessingService {
  constructor() {
    // Throttle mechanism for socket emissions
    this.lastEmissionTime = new Map();
    this.EMISSION_THROTTLE_MS = 500;
  }

  shouldEmitProgress(videoId) {
    const now = Date.now();
    const lastTime = this.lastEmissionTime.get(videoId) || 0;

    if (now - lastTime >= this.EMISSION_THROTTLE_MS) {
      this.lastEmissionTime.set(videoId, now);
      return true;
    }
    return false;
  }

  async processVideo(video) {
    const { _id: videoId, userId, path } = video;

    try {
      // Fetch user's analyzer preference dynamically
      const user = await User.findById(userId);
      const analyzerPreference = user?.analyzerPreference || "tensorflow";

      console.log(`🔍 Processing video ${videoId} for user ${userId}`);
      console.log(`📊 Using analyzer: ${analyzerPreference.toUpperCase()}`);

      // Mark as processing
      await VideoService.updateVideoStatus(
        videoId,
        "processing",
        "unchecked",
        0
      );
      SocketService.emitStatus(
        userId.toString(),
        videoId.toString(),
        "processing",
        "unchecked"
      );

      ffmpeg(path)
        .on("progress", async (progress) => {
          // Map FFmpeg progress (0-100) to 0-10%
          const percent = Math.round((progress.percent || 0) * 0.1);

          // Throttle emissions
          if (this.shouldEmitProgress(videoId.toString())) {
            console.log(`FFmpeg stage video ${videoId}: ${percent}%`);
            await VideoService.updateVideoStatus(
              videoId,
              "processing",
              "unchecked",
              percent
            ).catch((err) =>
              console.error(`⚠️  Progress update failed: ${err.message}`)
            );
            SocketService.emitUploadProgress(
              userId.toString(),
              videoId.toString(),
              percent
            );
          }
        })
        .on("error", async (err) => {
          console.error(`Error processing video ${videoId}: ${err.message}`);
          await VideoService.updateVideoStatus(
            videoId,
            "failed",
            "unchecked",
            0
          );
          SocketService.emitStatus(
            userId.toString(),
            videoId.toString(),
            "failed",
            "unchecked"
          );
          // Cleanup throttle map
          this.lastEmissionTime.delete(videoId.toString());
        })
        .on("end", async () => {
          console.log(`FFmpeg processing completed for video ${videoId}`);

          try {
            // Generate thumbnail
            const thumbnailDir = "uploads/thumbnails";
            if (!fs.existsSync(thumbnailDir)) {
              fs.mkdirSync(thumbnailDir, { recursive: true });
            }

            const thumbnailPath = `${thumbnailDir}/${videoId}.jpg`;

            await new Promise((resolve, reject) => {
              ffmpeg(path)
                .screenshots({
                  timestamps: ["1"], // Take screenshot at 1 second
                  filename: `${videoId}.jpg`,
                  folder: thumbnailDir,
                  size: "320x240",
                })
                .on("end", () => {
                  console.log(`✅ Thumbnail generated: ${thumbnailPath}`);
                  resolve();
                })
                .on("error", (err) => {
                  console.error(
                    `⚠️  Thumbnail generation failed: ${err.message}`
                  );
                  resolve(); // Don't fail the whole process if thumbnail fails
                });
            });

            // Update video with thumbnail path
            await VideoService.updateVideo(videoId, {
              thumbnail: thumbnailPath,
            });

            // Sensitivity Analysis based on user preference
            console.log(
              `Starting ${analyzerPreference.toUpperCase()} sensitivity analysis for video ${videoId}...`
            );

            let analysisResult;

            // Select analyzer based on user preference
            if (analyzerPreference === "google") {
              // Use Google Video Intelligence API
              try {
                analysisResult = await getGoogleVideoAnalyzer().analyzeVideo(
                  path,
                  (progress) => {
                    const analysisProgress = progress.percentage;

                    if (
                      this.shouldEmitProgress(videoId.toString()) ||
                      analysisProgress === 100
                    ) {
                      console.log(
                        `Google Analysis video ${videoId}: ${analysisProgress}% (Found: ${progress.detectedLabels.join(
                          ", "
                        )})`
                      );

                      VideoService.updateVideoStatus(
                        videoId,
                        "processing",
                        "unchecked",
                        analysisProgress
                      ).catch((err) =>
                        console.error(
                          `⚠️  Analysis progress update failed: ${err.message}`
                        )
                      );
                      SocketService.emitAnalysisProgress(
                        userId.toString(),
                        videoId.toString(),
                        analysisProgress,
                        progress.detectedLabels
                      );
                    }
                  }
                );
              } catch (googleError) {
                console.error(
                  `❌ Google analyzer failed: ${googleError.message}`
                );
                console.log("⚠️  Falling back to TensorFlow analyzer...");
                // Fallback to TensorFlow
                analysisResult =
                  await getSensitivityAnalysisService().analyzeVideo(
                    path,
                    async (progress) => {
                      const analysisProgress = progress.percentage;
                      if (
                        this.shouldEmitProgress(videoId.toString()) ||
                        analysisProgress === 100
                      ) {
                        await VideoService.updateVideoStatus(
                          videoId,
                          "processing",
                          "unchecked",
                          analysisProgress
                        ).catch((err) =>
                          console.error(
                            `⚠️  Analysis progress update failed: ${err.message}`
                          )
                        );
                        SocketService.emitAnalysisProgress(
                          userId.toString(),
                          videoId.toString(),
                          analysisProgress,
                          progress.detectedLabels
                        );
                      }
                    }
                  );
              }
            } else if (analyzerPreference === "hybrid") {
              // TODO: Implement Hybrid analyzer (TensorFlow + Google)
              console.log(
                "⚠️  Hybrid analyzer not yet implemented, using TensorFlow as fallback"
              );
              analysisResult =
                await getSensitivityAnalysisService().analyzeVideo(
                  path,
                  async (progress) => {
                    const analysisProgress = progress.percentage;
                    if (
                      this.shouldEmitProgress(videoId.toString()) ||
                      analysisProgress === 100
                    ) {
                      await VideoService.updateVideoStatus(
                        videoId,
                        "processing",
                        "unchecked",
                        analysisProgress
                      ).catch((err) =>
                        console.error(
                          `⚠️  Analysis progress update failed: ${err.message}`
                        )
                      );
                      SocketService.emitAnalysisProgress(
                        userId.toString(),
                        videoId.toString(),
                        analysisProgress,
                        progress.detectedLabels
                      );
                    }
                  }
                );
            } else {
              // Default: Use TensorFlow
              analysisResult =
                await getSensitivityAnalysisService().analyzeVideo(
                  path,
                  async (progress) => {
                    const analysisProgress = progress.percentage;
                    if (
                      this.shouldEmitProgress(videoId.toString()) ||
                      analysisProgress === 100
                    ) {
                      console.log(
                        `TensorFlow Analysis video ${videoId}: ${analysisProgress}% (Found: ${progress.detectedLabels.join(
                          ", "
                        )})`
                      );

                      await VideoService.updateVideoStatus(
                        videoId,
                        "processing",
                        "unchecked",
                        analysisProgress
                      ).catch((err) =>
                        console.error(
                          `⚠️  Analysis progress update failed: ${err.message}`
                        )
                      );
                      SocketService.emitAnalysisProgress(
                        userId.toString(),
                        videoId.toString(),
                        analysisProgress,
                        progress.detectedLabels
                      );
                    }
                  }
                );
            }

            console.log(`🔍 DEBUG: Analyzer completed, extracting results...`);
            console.log(`🔍 DEBUG: analysisResult =`, analysisResult);

            const { sensitivityStatus, confidence, detectedLabels, details } =
              analysisResult;

            console.log(`Analysis complete for video ${videoId}:`, {
              sensitivityStatus,
              confidence,
              detectedLabels,
            });

            // CRITICAL: Update video with analysis results and set status to completed
            let updatedVideo;
            try {
              console.log(
                `🔄 Attempting to update video ${videoId} in database...`
              );
              updatedVideo = await VideoService.updateVideoWithAnalysis(
                videoId.toString(),
                sensitivityStatus,
                confidence,
                detectedLabels,
                details
              );

              if (!updatedVideo) {
                throw new Error(
                  "updateVideoWithAnalysis returned null/undefined"
                );
              }

              console.log(`✅ Video ${videoId} updated in DB:`, {
                status: updatedVideo.status,
                sensitivityStatus: updatedVideo.sensitivityStatus,
                progress: updatedVideo.processingProgress,
              });
            } catch (dbError) {
              console.error(
                `❌ CRITICAL: Failed to update video ${videoId} in DB:`,
                dbError
              );
              // Fallback: Try basic status update
              try {
                await VideoService.updateVideoStatus(
                  videoId,
                  "completed",
                  sensitivityStatus,
                  100
                );
                console.log(
                  `⚠️  Fallback update succeeded for video ${videoId}`
                );
              } catch (fallbackError) {
                console.error(`❌ Fallback update also failed:`, fallbackError);
                throw dbError; // Re-throw original error
              }
            }

            // Emit final status update
            SocketService.emitStatus(
              userId.toString(),
              videoId.toString(),
              "completed",
              sensitivityStatus
            );

            // Finalize progress at 100%
            SocketService.emitAnalysisProgress(
              userId.toString(),
              videoId.toString(),
              100,
              detectedLabels
            );

            console.log(
              `Finished processing video ${videoId} - Status: ${sensitivityStatus}`
            );

            // Cleanup throttle map
            this.lastEmissionTime.delete(videoId.toString());
          } catch (analysisError) {
            console.error(
              `Error in sensitivity analysis for video ${videoId}:`,
              analysisError
            );

            // Mark specifically as FAILED on analysis error
            await VideoService.updateVideoStatus(
              videoId,
              "failed",
              "unchecked",
              0,
              analysisError.message
            );

            SocketService.emitStatus(
              userId.toString(),
              videoId.toString(),
              "failed",
              "unchecked"
            );
            SocketService.emitAnalysisProgress(
              userId.toString(),
              videoId.toString(),
              100
            );

            // Cleanup throttle map
            this.lastEmissionTime.delete(videoId.toString());
          }
        })
        // We adding a null output just to trigger the "end" event after processing the input
        // In a real scenario you would output to a file, format, etc.
        // fluent-ffmpeg needs an output to run.
        // We can use the 'null' format which discards output but processes the file
        .format("null")
        .output("-")
        .run();
    } catch (error) {
      console.error(`Fatal error processing video ${videoId}:`, error);
      await VideoService.updateVideoStatus(
        videoId,
        "failed",
        "unchecked",
        0,
        error.message
      );
      SocketService.emitStatus(
        userId.toString(),
        videoId.toString(),
        "failed",
        "unchecked"
      );
      // Cleanup throttle map
      this.lastEmissionTime.delete(videoId.toString());
    }
  }
}

module.exports = new ProcessingService();
