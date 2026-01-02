const tf = require("@tensorflow/tfjs");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const mobilenet = require("@tensorflow-models/mobilenet");
const canvas = require("canvas");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

class TensorFlowSensitivityAnalysisService {
  constructor() {
    this.objectDetectionModel = null;
    this.imageClassificationModel = null;

    // Hierarchical threat categorization
    this.threatCategories = {
      weapons: {
        firearms: {
          classes: ["rifle", "gun", "pistol", "shotgun", "revolver", "firearm"],
          severity: "critical",
          minConfidence: 0.4,
        },
        meleWeapons: {
          classes: ["knife", "sword", "axe", "machete", "dagger", "blade"],
          severity: "high",
          minConfidence: 0.5,
        },
        explosives: {
          classes: ["bomb", "grenade", "explosive", "missile"],
          severity: "critical",
          minConfidence: 0.3,
        },
      },
      violence: {
        direct: {
          classes: ["fight", "assault", "attack", "combat", "fighting"],
          severity: "high",
          minConfidence: 0.4,
        },
        graphic: {
          classes: ["blood", "injury", "wound", "gore"],
          severity: "high",
          minConfidence: 0.5,
        },
      },
      context: {
        military: {
          classes: [
            "military",
            "soldier",
            "army",
            "warfare",
            "battlefield",
            "tank",
          ],
          severity: "medium",
          minConfidence: 0.6,
        },
        criminal: {
          classes: ["crime", "robbery", "shooting", "terrorism"],
          severity: "high",
          minConfidence: 0.5,
        },
      },
    };

    // Risk scoring
    this.riskScoring = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
      safe: 0,
    };

    console.log("🚀 TensorFlow.js Multi-Strategy Analysis Service initialized");
  }

  async initialize() {
    if (this.objectDetectionModel && this.imageClassificationModel) {
      return;
    }

    console.log("🔄 Loading TensorFlow.js models...");

    try {
      this.objectDetectionModel = await cocoSsd.load();
      console.log("✅ COCO-SSD object detection model loaded");

      this.imageClassificationModel = await mobilenet.load();
      console.log("✅ MobileNet classification model loaded");

      console.log("✅ All TensorFlow models ready!");
    } catch (error) {
      console.error("❌ Error loading models:", error);
      throw error;
    }
  }

  async analyzeVideo(videoPath, onProgress = null) {
    try {
      await this.initialize();

      console.log("📹 Extracting frames for analysis...");
      const framesDir = await this.extractFrames(videoPath, {
        fps: 0.25, // Reduced from 0.5 for faster processing
        quality: 2,
      });

      const frameFiles = fs
        .readdirSync(framesDir)
        .filter((f) => f.endsWith(".jpg"));
      const totalFrames = frameFiles.length;

      console.log(`🎬 Analyzing ${totalFrames} frames...`);

      const aggregatedResults = {
        weaponDetections: [],
        violenceIndicators: [],
        contextualFlags: [],
        overallRiskScore: 0,
        frameAnalysis: [],
        detectedLabels: [],
      };

      // Throttle progress updates to prevent socket flooding
      let lastProgressTime = 0;
      const PROGRESS_THROTTLE_MS = 500;

      for (let i = 0; i < frameFiles.length; i++) {
        const framePath = path.join(framesDir, frameFiles[i]);

        const frameResult = await this.analyzeFrameMultiStrategy(framePath, i);

        if (frameResult.weapons.length > 0) {
          aggregatedResults.weaponDetections.push(...frameResult.weapons);
        }
        if (frameResult.violence.length > 0) {
          aggregatedResults.violenceIndicators.push(...frameResult.violence);
        }
        if (frameResult.context.length > 0) {
          aggregatedResults.contextualFlags.push(...frameResult.context);
        }

        aggregatedResults.frameAnalysis.push(frameResult);
        aggregatedResults.overallRiskScore += frameResult.riskScore;

        const currentFrameLabels = [
          ...(frameResult.weapons || []),
          ...(frameResult.violence || []),
          ...(frameResult.context || []),
        ]
          .map((l) => l.type)
          .filter(Boolean);

        currentFrameLabels.forEach((label) => {
          if (!aggregatedResults.detectedLabels.includes(label)) {
            aggregatedResults.detectedLabels.push(label);
          }
        });

        // Throttled progress reporting - only emit every 500ms or on last frame
        const now = Date.now();
        const isLastFrame = i === frameFiles.length - 1;
        const shouldEmitProgress =
          isLastFrame || now - lastProgressTime >= PROGRESS_THROTTLE_MS;

        if (onProgress && shouldEmitProgress) {
          lastProgressTime = now;
          onProgress({
            current: i + 1,
            total: totalFrames,
            percentage: Math.round(((i + 1) / totalFrames) * 100),
            currentRiskScore: Math.round(
              aggregatedResults.overallRiskScore / (i + 1)
            ),
            detectedLabels: aggregatedResults.detectedLabels,
          });
        }

        console.log(
          `  Frame ${
            i + 1
          }/${totalFrames}: Risk=${frameResult.riskScore.toFixed(1)}`
        );
      }

      this.cleanupFrames(framesDir);

      const finalAssessment = this.calculateRiskAssessment(
        aggregatedResults,
        totalFrames
      );

      console.log(
        `\n✅ Analysis complete: ${finalAssessment.sensitivityStatus.toUpperCase()}`
      );
      console.log(`   Risk Score: ${finalAssessment.riskScore}/100`);
      console.log(`   Confidence: ${finalAssessment.confidence}%`);
      console.log(`   Labels: ${finalAssessment.detectedLabels.join(", ")}`);

      return finalAssessment;
    } catch (error) {
      console.error("❌ Error in TensorFlow analysis:", error);
      throw error;
    }
  }

  async analyzeFrameMultiStrategy(framePath, frameIndex) {
    const img = await canvas.loadImage(framePath);
    const cvs = canvas.createCanvas(img.width, img.height);
    const ctx = cvs.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const results = {
      frameIndex,
      weapons: [],
      violence: [],
      context: [],
      riskScore: 0,
      confidence: 0,
    };

    // Strategy 1: Object Detection
    const objectResults = await this.strategyObjectDetection(cvs);
    results.weapons.push(...objectResults.weapons);
    results.violence.push(...objectResults.violence);

    // Strategy 2: Scene Classification
    const classificationResults = await this.strategyImageClassification(cvs);
    results.context.push(...classificationResults.context);

    // Strategy 3: Color Analysis
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const colorResults = this.strategyColorAnalysis(imageData);
    if (colorResults.hasBlood) {
      results.violence.push({
        type: "blood_detected",
        confidence: colorResults.bloodConfidence,
        severity: "high",
      });
    }

    // Strategy 4: Composition Analysis
    const compositionResults = this.strategyCompositionAnalysis(imageData);
    if (compositionResults.hasViolenceIndicators) {
      results.violence.push({
        type: "violence_composition",
        confidence: compositionResults.confidence,
        severity: "medium",
      });
    }

    results.riskScore = this.calculateFrameRiskScore(results);
    results.confidence = this.calculateConfidence(results);

    return results;
  }

  async strategyObjectDetection(canvas) {
    const predictions = await this.objectDetectionModel.detect(canvas);
    const results = { weapons: [], violence: [] };

    for (const pred of predictions) {
      const label = pred.class.toLowerCase();
      const confidence = pred.score;

      // Check weapons
      for (const [subcat, config] of Object.entries(
        this.threatCategories.weapons
      )) {
        if (!config || !config.classes) continue;

        const isMatch = config.classes.some(
          (cls) =>
            label.includes(cls) || this.calculateSimilarity(label, cls) > 0.75
        );

        if (isMatch && confidence >= config.minConfidence) {
          results.weapons.push({
            type: `weapons_${subcat}`,
            object: pred.class,
            confidence: Math.round(confidence * 100),
            severity: config.severity,
            bbox: pred.bbox,
          });
        }
      }

      // Check violence
      for (const [subcat, config] of Object.entries(
        this.threatCategories.violence
      )) {
        if (!config || !config.classes) continue;

        const isMatch = config.classes.some(
          (cls) =>
            label.includes(cls) || this.calculateSimilarity(label, cls) > 0.75
        );

        if (isMatch && confidence >= config.minConfidence) {
          results.violence.push({
            type: `violence_${subcat}`,
            object: pred.class,
            confidence: Math.round(confidence * 100),
            severity: config.severity,
          });
        }
      }
    }

    return results;
  }

  async strategyImageClassification(canvas) {
    const predictions = await this.imageClassificationModel.classify(canvas);
    const results = { context: [] };

    for (const pred of predictions) {
      const label = pred.className.toLowerCase();

      for (const [subcat, config] of Object.entries(
        this.threatCategories.context
      )) {
        if (!config || !config.classes) continue;

        const isMatch = config.classes.some((cls) => label.includes(cls));

        if (isMatch && pred.probability >= config.minConfidence) {
          results.context.push({
            type: `context_${subcat}`,
            scene: pred.className,
            confidence: Math.round(pred.probability * 100),
            severity: config.severity,
          });
        }
      }
    }

    return results;
  }

  strategyColorAnalysis(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let bloodLikePixels = 0;
    let bloodClusters = 0;
    const totalPixels = data.length / 4;

    for (let y = 0; y < height; y += 20) {
      for (let x = 0; x < width; x += 20) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isBloodLike =
          (r > 100 && r < 180 && g < 60 && b < 60) ||
          (r > 180 && g < 100 && b < 100 && r > g * 1.8) ||
          (r > 120 && g > 60 && g < r * 0.7 && b < g * 0.8);

        if (isBloodLike) {
          bloodLikePixels++;
          if (this.checkNeighborhood(data, x, y, width, height, 20)) {
            bloodClusters++;
          }
        }
      }
    }

    const bloodPercentage = bloodLikePixels / (totalPixels / 100);
    const hasBlood = bloodPercentage > 0.5 || bloodClusters > 3;

    return {
      hasBlood,
      bloodConfidence: Math.min(bloodPercentage * 10 + bloodClusters * 5, 100),
      bloodPercentage: Math.round(bloodPercentage * 100) / 100,
    };
  }

  strategyCompositionAnalysis(imageData) {
    const data = imageData.data;
    let darkPixels = 0;
    let highContrast = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      if (brightness < 40) darkPixels++;

      if (i + 4 < data.length) {
        const nextBrightness = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        if (Math.abs(brightness - nextBrightness) > 100) {
          highContrast++;
        }
      }
    }

    const darkPercentage = (darkPixels / totalPixels) * 100;
    const contrastPercentage = (highContrast / totalPixels) * 100;
    const violenceScore =
      (darkPercentage > 40 ? 30 : 0) + (contrastPercentage > 15 ? 40 : 0);

    return {
      hasViolenceIndicators: violenceScore > 50,
      confidence: violenceScore,
      darkPercentage: Math.round(darkPercentage),
      contrastPercentage: Math.round(contrastPercentage),
    };
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  checkNeighborhood(data, x, y, width, height, radius) {
    let matches = 0;
    for (let dy = -radius; dy <= radius; dy += 5) {
      for (let dx = -radius; dx <= radius; dx += 5) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const i = (ny * width + nx) * 4;
          const r = data[i];
          const g = data[i + 1];
          if (r > 150 && r > g * 1.5) matches++;
        }
      }
    }
    return matches > 3;
  }

  calculateFrameRiskScore(results) {
    let score = 0;
    results.weapons.forEach((w) => {
      score += this.riskScoring[w.severity] * (w.confidence / 100);
    });
    results.violence.forEach((v) => {
      score += this.riskScoring[v.severity] * (v.confidence / 100);
    });
    results.context.forEach((c) => {
      score += this.riskScoring[c.severity] * (c.confidence / 100) * 0.5;
    });
    return Math.min(score, 100);
  }

  calculateConfidence(results) {
    const allDetections = [
      ...results.weapons,
      ...results.violence,
      ...results.context,
    ];
    if (allDetections.length === 0) return 95;
    const avgConfidence =
      allDetections.reduce((sum, d) => sum + d.confidence, 0) /
      allDetections.length;
    return Math.round(avgConfidence);
  }

  calculateRiskAssessment(aggregatedResults, totalFrames) {
    const avgRiskScore = aggregatedResults.overallRiskScore / totalFrames;
    const peakRiskScore = Math.max(
      ...aggregatedResults.frameAnalysis.map((f) => f.riskScore),
      0
    );

    console.log(`\n📊 Risk Calculation:`);
    console.log(`   Average Risk: ${avgRiskScore.toFixed(2)}`);
    console.log(`   Peak Risk: ${peakRiskScore.toFixed(2)}`);

    // Collect labels FIRST (needed for mandatory flagging logic)
    const labels = new Set();
    aggregatedResults.weaponDetections.forEach((w) =>
      labels.add(w.type.toUpperCase())
    );
    aggregatedResults.violenceIndicators.forEach((v) =>
      labels.add(v.type.toUpperCase())
    );

    console.log(
      `   Detected Labels: ${Array.from(labels).join(", ") || "none"}`
    );

    // FIXED: More aggressive thresholds and mandatory flagging
    let status = "safe";
    let severity = "none";

    // Step 1: Check if ANY critical labels exist (mandatory flags)
    const hasCriticalLabels =
      labels.has("WEAPONS_FIREARMS") ||
      labels.has("WEAPONS_EXPLOSIVES") ||
      labels.has("WEAPONS_MELEWEAPONS") ||
      labels.has("BLOOD_DETECTED") ||
      labels.has("VIOLENCE_DIRECT") ||
      labels.has("VIOLENCE_GRAPHIC");

    if (hasCriticalLabels) {
      console.log(`   ⚠️  Critical labels detected - forcing flagged status`);
      status = "flagged";

      // Determine severity based on label type
      if (labels.has("WEAPONS_FIREARMS") || labels.has("WEAPONS_EXPLOSIVES")) {
        severity = "critical";
      } else if (
        labels.has("BLOOD_DETECTED") ||
        labels.has("VIOLENCE_GRAPHIC")
      ) {
        severity = "high";
      } else {
        severity = "medium";
      }
    }

    // Step 2: Apply threshold-based logic (can only upgrade severity, never downgrade)
    const combinedRiskScore = avgRiskScore * 0.4 + peakRiskScore * 0.6; // Give more weight to peak
    console.log(`   Combined Risk Score: ${combinedRiskScore.toFixed(2)}`);

    if (peakRiskScore > 60 || combinedRiskScore > 40) {
      status = "flagged";
      if (severity === "none" || severity === "low") {
        severity = peakRiskScore > 80 ? "critical" : "high";
      }
    } else if (peakRiskScore > 40 || combinedRiskScore > 25) {
      status = "flagged";
      if (severity === "none") {
        severity = "medium";
      }
    } else if (peakRiskScore > 20 || combinedRiskScore > 15) {
      status = "flagged";
      if (severity === "none") {
        severity = "low";
      }
    }

    // Step 3: Safety check - if no labels detected, ensure it's actually safe
    if (
      labels.size === 0 ||
      (labels.size === 1 && labels.has("SAFE_CONTENT"))
    ) {
      status = "safe";
      severity = "none";
      labels.clear();
      labels.add("SAFE_CONTENT");
    }

    console.log(`   Final Status: ${status.toUpperCase()} (${severity})`);

    return {
      sensitivityStatus: status,
      severity,
      confidence: Math.round(
        status === "safe" ? 95 : Math.min(combinedRiskScore + 50, 95)
      ),
      riskScore: Math.round(combinedRiskScore),
      detectedLabels: Array.from(labels),
      details: {
        method: "tensorflow_multi_strategy",
        totalFramesAnalyzed: totalFrames,
        avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        peakRiskScore: Math.round(peakRiskScore * 10) / 10,
        combinedRiskScore: Math.round(combinedRiskScore * 10) / 10,
        weaponDetections: {
          total: aggregatedResults.weaponDetections.length,
          details: aggregatedResults.weaponDetections.slice(0, 10),
        },
        violenceIndicators: {
          total: aggregatedResults.violenceIndicators.length,
          details: aggregatedResults.violenceIndicators.slice(0, 10),
        },
        contextualFlags: {
          total: aggregatedResults.contextualFlags.length,
          details: aggregatedResults.contextualFlags.slice(0, 5),
        },
      },
    };
  }

  async extractFrames(videoPath, options = {}) {
    const framesDir = path.join(
      __dirname,
      "../../temp",
      `frames_${Date.now()}`
    );
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          "-vf",
          `fps=${options.fps || 0.5}`,
          "-q:v",
          `${options.quality || 2}`,
        ])
        .output(path.join(framesDir, "frame_%04d.jpg"))
        .on("end", () => {
          console.log(`✅ Frames extracted to ${framesDir}`);
          resolve(framesDir);
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          reject(err);
        })
        .run();
    });
  }

  cleanupFrames(framesDir) {
    try {
      if (fs.existsSync(framesDir)) {
        fs.rmSync(framesDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up: ${framesDir}`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

let instance = null;

function getInstance() {
  if (!instance) {
    instance = new TensorFlowSensitivityAnalysisService();
  }
  return instance;
}

module.exports = {
  getInstance,
  TensorFlowSensitivityAnalysisService,
};
