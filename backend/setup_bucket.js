require("dotenv").config();
const { Storage } = require("@google-cloud/storage");

async function createBucket() {
  console.log("=== Creating Google Cloud Storage Bucket ===\n");

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

  console.log(`Project ID: ${projectId}`);
  console.log(`Bucket Name: ${bucketName}\n`);

  try {
    const storage = new Storage({ projectId });

    // Check if bucket already exists
    const [exists] = await storage.bucket(bucketName).exists();

    if (exists) {
      console.log(`✅ Bucket '${bucketName}' already exists!`);
      return;
    }

    // Create the bucket
    console.log(`Creating bucket '${bucketName}'...`);
    const [bucket] = await storage.createBucket(bucketName, {
      location: "US",
      storageClass: "STANDARD",
    });

    console.log(`✅ Bucket '${bucket.name}' created successfully!`);
    console.log(`   Location: ${bucket.metadata.location}`);
    console.log(`   Storage Class: ${bucket.metadata.storageClass}`);

    // Set lifecycle rule to auto-delete temp files after 1 day
    await bucket.setMetadata({
      lifecycle: {
        rule: [
          {
            action: { type: "Delete" },
            condition: { age: 1 }, // Delete files older than 1 day
          },
        ],
      },
    });

    console.log(`✅ Lifecycle rule set: Auto-delete files after 1 day`);
  } catch (error) {
    console.error("\n❌ Error creating bucket:");
    console.error(error.message);

    if (error.code === 409) {
      console.log(
        "\nℹ️  Bucket already exists (owned by another project or user)"
      );
      console.log("   Try a different bucket name in .env");
    }

    process.exit(1);
  }
}

createBucket();
