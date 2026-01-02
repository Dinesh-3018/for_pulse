const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/authMiddleware");
const User = require("../models/User");

/**
 * @route   GET /api/onboarding/status
 * @desc    Check if user has completed onboarding
 * @access  Private
 */
router.get("/status", auth, async (req, res) => {
  try {
    // Fetch fresh user data from database to ensure we have all fields
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      onboardingCompleted: user.onboardingCompleted || false,
      onboardingStep: user.onboardingStep || 0,
      analyzerPreference: user.analyzerPreference || "hybrid",
      uploadLimit: user.uploadLimit || 10,
      uploadCount: user.uploadCount || 0,
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/onboarding/analyzers
 * @desc    Get available analyzer options
 * @access  Private
 */
router.get("/analyzers", auth, async (req, res) => {
  try {
    const analyzers = [
      {
        id: "hybrid",
        name: "Hybrid AI",
        description: "Best accuracy - TensorFlow + Google API",
        features: [
          "Blood Detection",
          "Weapon Detection",
          "Violence Context",
          "Explicit Content",
        ],
        accuracy: "90-95%",
        cost: "Low ($0.10/min)",
        recommended: true,
        icon: "🔬",
      },
      {
        id: "google",
        name: "Google Video Intelligence",
        description: "Reliable cloud-based analysis",
        features: [
          "Weapon Detection",
          "Explicit Content",
          "Violence Labels",
          "Military Context",
        ],
        accuracy: "85-90%",
        cost: "Medium ($0.10/min)",
        recommended: false,
        icon: "☁️",
      },
      {
        id: "tensorflow",
        name: "TensorFlow.js",
        description: "Free, fast, privacy-focused",
        features: [
          "Blood Detection",
          "Violence Indicators",
          "Local Processing",
          "No Cloud Upload",
        ],
        accuracy: "70-80%",
        cost: "Free",
        recommended: false,
        icon: "🤖",
        privacy: true,
      },
    ];

    res.json({ analyzers });
  } catch (error) {
    console.error("Error fetching analyzers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   PUT /api/onboarding/preferences
 * @desc    Save user's analyzer preference
 * @access  Private
 */
router.put("/preferences", auth, async (req, res) => {
  try {
    const { analyzerPreference } = req.body;

    // Validate analyzer preference
    const validAnalyzers = ["hybrid", "google", "tensorflow"];
    if (!validAnalyzers.includes(analyzerPreference)) {
      return res.status(400).json({
        error: "Invalid analyzer preference",
      });
    }

    // Check Google analyzer quota
    if (analyzerPreference === "google") {
      const {
        getInstance: getQuotaService,
      } = require("../services/QuotaService");
      const canUse = await getQuotaService().canUseGoogleAnalyzer(req.user._id);

      if (!canUse) {
        const quotaStatus = await getQuotaService().getQuotaStatus();
        return res.status(403).json({
          error:
            "Google analyzer quota full (5/5 users). Please select TensorFlow or Hybrid.",
          quotaStatus,
        });
      }
    }

    // Fetch fresh user data
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.analyzerPreference = analyzerPreference;
    user.onboardingStep = 2; // Move to next step
    await user.save();

    res.json({
      message: "Preferences saved successfully",
      analyzerPreference: user.analyzerPreference,
      onboardingStep: user.onboardingStep,
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   POST /api/onboarding/complete
 * @desc    Mark onboarding as complete
 * @access  Private
 */
router.post("/complete", auth, async (req, res) => {
  try {
    // Fetch fresh user data
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.onboardingCompleted = true;
    user.onboardingStep = 3; // Final step
    await user.save();

    res.json({
      message: "Onboarding completed successfully",
      onboardingCompleted: true,
      analyzerPreference: user.analyzerPreference,
      uploadLimit: user.uploadLimit,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   PUT /api/onboarding/step
 * @desc    Update current onboarding step
 * @access  Private
 */
router.put("/step", auth, async (req, res) => {
  try {
    const { step } = req.body;

    if (typeof step !== "number" || step < 0 || step > 3) {
      return res.status(400).json({ error: "Invalid step number" });
    }

    const user = req.user;
    user.onboardingStep = step;
    await user.save();

    res.json({
      message: "Step updated successfully",
      onboardingStep: user.onboardingStep,
    });
  } catch (error) {
    console.error("Error updating step:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
