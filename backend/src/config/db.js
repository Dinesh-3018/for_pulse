const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(
      "The database might not be running. Please check your MongoDB service."
    );
    // In a real production app, we might want to exit,
    // but for this dev environment, we'll keep the process alive
    // so the user can see the logs.
  }
};

// Monitor connection events
mongoose.connection.on("error", (err) => {
  console.error(`Mongoose default connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose default connection disconnected");
});

module.exports = connectDB;
