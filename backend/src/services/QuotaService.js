const User = require("../models/User");

class QuotaService {
  /**
   * Get count of users currently using Google analyzer
   */
  async getGoogleAnalyzerCount() {
    return await User.countDocuments({ analyzerPreference: "google" });
  }

  /**
   * Check if a user can use Google analyzer
   * Returns true if:
   * 1. User already has Google preference (already using it)
   * 2. Quota is available (< 5 users)
   */
  async canUseGoogleAnalyzer(userId) {
    const user = await User.findById(userId);

    if (!user) return false;

    // If user is already using Google, they can keep using it
    if (user.analyzerPreference === "google") {
      return true;
    }

    // Check if quota is available
    const count = await this.getGoogleAnalyzerCount();
    return count < 5; // Max 5 users
  }

  /**
   * Get current quota status for all analyzers
   */
  async getQuotaStatus() {
    const googleUsers = await this.getGoogleAnalyzerCount();

    return {
      google: {
        current: googleUsers,
        max: 5,
        available: Math.max(0, 5 - googleUsers),
        isFull: googleUsers >= 5,
      },
      tensorflow: {
        unlimited: true,
        description: "No limit on TensorFlow users",
      },
      hybrid: {
        requiresGoogle: true,
        description: "Hybrid mode requires Google quota availability",
      },
    };
  }

  /**
   * Get list of users currently using Google analyzer
   */
  async getGoogleUsers() {
    return await User.find({ analyzerPreference: "google" })
      .select("email role createdAt")
      .sort({ createdAt: 1 });
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new QuotaService();
  }
  return instance;
}

module.exports = { getInstance, QuotaService };
