const video = require("@google-cloud/video-intelligence");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

class GoogleVideoAnalyzer {
  constructor() {
    this.videoClient = new video.VideoIntelligenceServiceClient();
    this.storage = new Storage();
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

    // Unsafe content labels to detect
    this.unsafeLabels = [
      "weapon",
      "gun",
      "rifle",
      "pistol",
      "firearm",
      "knife",
      "sword",
      "violence",
      "violent",
      "fighting",
      "fight",
      "blood",
      "gore",
      "explosion",
      "bomb",
      "war",
      "military",
      "army",
      "soldier",
      "shooting",
      "shot",
      "kill",
      "death",
      "dead",
      "murder",
      "assault",
      "attack",
      "terrorism",
      "terrorist",
    ];

    console.log("✅ Google Video Intelligence Analyzer initialized");
  }

  /**
   * Analyze video using Google Video Intelligence API
   * @param {string} videoPath - Local path to video file
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeVideo(videoPath, onProgress = null) {
    try {
      // Upload to Google Cloud Storage
      console.log("📤 Uploading video to Google Cloud Storage...");
      const gcsUri = await this.uploadToGCS(videoPath);

      if (onProgress) {
        onProgress({
          current: 1,
          total: 3,
          percentage: 33,
          detectedLabels: [],
        });
      }

      // Perform analysis
      console.log("🔍 Running Google Video Intelligence analysis...");
      const [operation] = await this.videoClient.annotateVideo({
        inputUri: gcsUri,
        features: ["EXPLICIT_CONTENT_DETECTION", "LABEL_DETECTION"],
      });

      if (onProgress) {
        onProgress({
          current: 2,
          total: 3,
          percentage: 66,
          detectedLabels: [],
        });
      }

      const [operationResult] = await operation.promise();

      // Parse results
      const explicitResult = this.parseExplicitContentResults(operationResult);
      const labelResult = this.parseLabelDetectionResults(operationResult);
      const combinedResult = this.combineResults(explicitResult, labelResult);

      // Clean up
      await this.deleteFromGCS(gcsUri);

      if (onProgress) {
        onProgress({
          current: 3,
          total: 3,
          percentage: 100,
          detectedLabels: combinedResult.detectedLabels,
        });
      }

      return combinedResult;
    } catch (error) {
      console.error("❌ Google Video Intelligence error:", error);
      throw error;
    }
  }

  async uploadToGCS(localPath) {
    const fileName = `temp-analysis/${Date.now()}-${path.basename(localPath)}`;
    const bucket = this.storage.bucket(this.bucketName);

    await bucket.upload(localPath, {
      destination: fileName,
      metadata: { contentType: "video/mp4" },
    });

    return `gs://${this.bucketName}/${fileName}`;
  }

  async deleteFromGCS(gcsUri) {
    try {
      const fileName = gcsUri.replace(`gs://${this.bucketName}/`, "");
      await this.storage.bucket(this.bucketName).file(fileName).delete();
      console.log(`🧹 Deleted temporary file: ${fileName}`);
    } catch (error) {
      console.error("⚠️  Error deleting GCS file:", error.message);
    }
  }

  parseLabelDetectionResults(result) {
    const segmentLabels =
      result.annotationResults[0]?.segmentLabelAnnotations || [];
    const shotLabels = result.annotationResults[0]?.shotLabelAnnotations || [];
    const allLabels = [...segmentLabels, ...shotLabels];

    if (allLabels.length === 0) {
      return {
        sensitivityStatus: "safe",
        confidence: 90,
        detectedLabels: [],
        details: { method: "google_label_detection" },
      };
    }

    const detectedUnsafeLabels = [];
    let maxConfidence = 0;

    allLabels.forEach((annotation) => {
      const label = annotation.entity?.description?.toLowerCase() || "";
      let confidence = annotation.confidence || 0.8;

      const isUnsafe = this.unsafeLabels.some((unsafeLabel) =>
        label.includes(unsafeLabel)
      );

      if (isUnsafe) {
        detectedUnsafeLabels.push({
          label: annotation.entity.description,
          confidence: Math.round(confidence * 100),
        });
        maxConfidence = Math.max(maxConfidence, confidence);
      }
    });

    const isFlagged = detectedUnsafeLabels.length > 0;

    return {
      sensitivityStatus: isFlagged ? "flagged" : "safe",
      confidence: isFlagged ? Math.round(maxConfidence * 100) : 95,
      detectedLabels: detectedUnsafeLabels.map((l) => l.label.toUpperCase()),
      details: {
        method: "google_label_detection",
        unsafeLabelsFound: detectedUnsafeLabels,
        totalLabelsAnalyzed: allLabels.length,
      },
    };
  }

  parseExplicitContentResults(result) {
    const explicitAnnotation = result.annotationResults[0]?.explicitAnnotation;

    if (!explicitAnnotation || !explicitAnnotation.frames) {
      return {
        sensitivityStatus: "safe",
        confidence: 95,
        detectedLabels: [],
        details: { method: "google_explicit_content" },
      };
    }

    const frames = explicitAnnotation.frames;
    let maxLikelihood = "VERY_UNLIKELY";
    let totalConfidence = 0;
    const detectedLabels = new Set();

    const confidenceMap = {
      VERY_UNLIKELY: 5,
      UNLIKELY: 20,
      POSSIBLE: 50,
      LIKELY: 75,
      VERY_LIKELY: 95,
    };

    frames.forEach((frame) => {
      const likelihood = frame.pornographyLikelihood;
      detectedLabels.add(likelihood);
      totalConfidence += confidenceMap[likelihood] || 0;

      const likelihoodOrder = [
        "VERY_UNLIKELY",
        "UNLIKELY",
        "POSSIBLE",
        "LIKELY",
        "VERY_LIKELY",
      ];
      if (
        likelihoodOrder.indexOf(likelihood) >
        likelihoodOrder.indexOf(maxLikelihood)
      ) {
        maxLikelihood = likelihood;
      }
    });

    const avgConfidence = Math.round(totalConfidence / frames.length);
    const isFlagged = ["LIKELY", "VERY_LIKELY", "POSSIBLE"].includes(
      maxLikelihood
    );

    return {
      sensitivityStatus: isFlagged ? "flagged" : "safe",
      confidence: isFlagged ? avgConfidence : 100 - avgConfidence,
      detectedLabels: isFlagged ? ["EXPLICIT_CONTENT"] : [],
      details: {
        method: "google_explicit_content",
        maxLikelihood,
        totalFramesAnalyzed: frames.length,
      },
    };
  }

  combineResults(explicitResult, labelResult) {
    const isFlagged =
      explicitResult.sensitivityStatus === "flagged" ||
      labelResult.sensitivityStatus === "flagged";

    const confidence = Math.max(
      explicitResult.confidence,
      labelResult.confidence
    );
    const allLabels = [
      ...explicitResult.detectedLabels,
      ...labelResult.detectedLabels,
    ];

    return {
      sensitivityStatus: isFlagged ? "flagged" : "safe",
      confidence,
      detectedLabels: allLabels,
      details: {
        method: "google_video_intelligence",
        explicitContent: explicitResult.details,
        labelDetection: labelResult.details,
        combinedResult: {
          explicitFlagged: explicitResult.sensitivityStatus === "flagged",
          labelsFlagged: labelResult.sensitivityStatus === "flagged",
        },
      },
    };
  }
}

let instance = null;

function getInstance() {
  if (!instance) {
    instance = new GoogleVideoAnalyzer();
  }
  return instance;
}

module.exports = { getInstance, GoogleVideoAnalyzer };
