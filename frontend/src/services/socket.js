import { io } from "socket.io-client";
import {
  setProcessingProgress,
  setAnalysisProgress,
  setVideoStatus,
} from "../store/slices/videoSlice";

let socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Throttle mechanism for client-side events
const throttleMap = new Map();
const THROTTLE_MS = 300; // Client-side throttle (300ms)

function shouldProcessEvent(eventKey) {
  const now = Date.now();
  const lastTime = throttleMap.get(eventKey) || 0;

  if (now - lastTime >= THROTTLE_MS) {
    throttleMap.set(eventKey, now);
    return true;
  }
  return false;
}

export const initSocket = (userId, dispatch) => {
  if (socket && socket.connected) {
    console.log("Socket already connected, re-joining room for user:", userId);
    socket.emit("join", userId);
    return socket;
  }

  console.log("Initializing new socket connection for user:", userId);

  socket = io("http://localhost:5001", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    pingTimeout: 120000, // 120 seconds - long enough for video analysis
    pingInterval: 25000, // 25 seconds
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    console.log("⏱️  Ping timeout: 120s, Ping interval: 25s");
    console.log("👤 Joining room for user:", userId);
    reconnectAttempts = 0;
    socket.emit("join", userId);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    reconnectAttempts = attemptNumber;
    console.log(
      `Reconnection attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}`
    );
  });

  socket.on("reconnect_failed", () => {
    console.error("Failed to reconnect after maximum attempts");
  });

  socket.on("video-upload-progress", (data) => {
    // No client-side throttling - backend already throttles
    console.log("Socket received video-upload-progress:", data);
    dispatch(
      setProcessingProgress({
        videoId: data.videoId,
        progress: data.progress,
      })
    );
  });

  socket.on("video-analysis-progress", (data) => {
    // No client-side throttling - backend already throttles at 500ms
    console.log("Socket received video-analysis-progress:", data);
    dispatch(
      setAnalysisProgress({
        videoId: data.videoId,
        progress: data.progress,
        detectedLabels: data.detectedLabels,
      })
    );
  });

  socket.on("video-status", (data) => {
    // Always process status updates immediately (not throttled)
    console.log("Socket received video-status:", data);
    dispatch(
      setVideoStatus({
        videoId: data.videoId,
        status: data.status,
        sensitivityStatus: data.sensitivityStatus,
      })
    );
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    throttleMap.clear();
    reconnectAttempts = 0;
  }
};
