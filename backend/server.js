require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport");
const connectDB = require("./src/config/db");
const { errorHandler } = require("./src/middleware/errorHandler");
const authRoutes = require("./src/routes/auth");
const videoRoutes = require("./src/routes/videos");
const onboardingRoutes = require("./src/routes/onboarding");
const superadminRoutes = require("./src/routes/superadmin");

const http = require("http");
const SocketService = require("./src/services/SocketService");
const {
  initializeGoogleCredentials,
} = require("./src/config/googleCredentials");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
SocketService.init(server);

// Connect to Database
connectDB();

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({
  origin: ['https://for-pulse.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Passport middleware
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/superadmin", superadminRoutes);

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

// Swagger Middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get("/", (req, res) => {
  res.json({ message: "Video Analyzer API is running" });
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});
