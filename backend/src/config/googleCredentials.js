const fs = require("fs");
const path = require("path");

/**
 * Initialize Google credentials from environment variables or file
 * Priority: 1) Individual env vars, 2) Base64 env var, 3) JSON file
 */
function initializeGoogleCredentials() {
  // Option 1: Build from individual environment variables (.env approach)
  if (
    process.env.GOOGLE_PROJECT_ID &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_CLIENT_EMAIL
  ) {
    try {
      console.log("📦 Building Google credentials from .env variables...");

      const credentials = {
        type: process.env.GOOGLE_TYPE || "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Fix escaped newlines
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        auth_uri:
          process.env.GOOGLE_AUTH_URI ||
          "https://accounts.google.com/o/oauth2/auth",
        token_uri:
          process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          process.env.GOOGLE_AUTH_PROVIDER_CERT_URL ||
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL || "",
        universe_domain: "googleapis.com",
      };

      // Write to temporary file (required by Google SDK)
      const tempPath = path.join(
        __dirname,
        "..",
        "..",
        "temp-google-credentials.json"
      );
      fs.writeFileSync(tempPath, JSON.stringify(credentials, null, 2), "utf-8");

      // Set environment variable for Google SDK
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;

      console.log("✅ Google credentials loaded from .env variables");
      return tempPath;
    } catch (error) {
      console.error("❌ Failed to build credentials from .env:", error.message);
    }
  }

  // Option 2: Use base64-encoded credentials (backward compatibility)
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    try {
      console.log("📦 Loading Google credentials from base64...");
      const credentials = Buffer.from(
        process.env.GOOGLE_CREDENTIALS_BASE64,
        "base64"
      ).toString("utf-8");
      const tempPath = path.join(
        __dirname,
        "..",
        "..",
        "temp-google-credentials.json"
      );
      fs.writeFileSync(tempPath, credentials, "utf-8");
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;
      console.log("✅ Google credentials loaded from base64");
      return tempPath;
    } catch (error) {
      console.error("❌ Failed to load from base64:", error.message);
    }
  }

  // Option 3: Use credentials file (development)
  const credentialsPath = path.join(
    __dirname,
    "..",
    "..",
    "google-credentials.json"
  );

  if (fs.existsSync(credentialsPath)) {
    console.log("📁 Using Google credentials from file");
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    return credentialsPath;
  }

  // No credentials found
  console.warn("⚠️  No Google credentials found!");
  console.warn(
    "   Add to .env: GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL"
  );
  console.warn("   OR keep google-credentials.json file");

  return null;
}

module.exports = { initializeGoogleCredentials };
