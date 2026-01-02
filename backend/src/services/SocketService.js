const { Server } = require("socket.io");

class SocketService {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 120000, // 120 seconds - must be longer than analysis time
      pingInterval: 25000, // 25 seconds
    });

    this.io.on("connection", (socket) => {
      console.log(`✅ Socket connected: ${socket.id}`);

      socket.on("join", (userId) => {
        const room = userId.toString();
        socket.join(room);
        console.log(
          `👤 User ${userId} joined room ${room} (Socket: ${socket.id})`
        );

        // Verify room membership
        const rooms = Array.from(socket.rooms);
        console.log(`📍 Socket ${socket.id} is in rooms:`, rooms);
      });

      socket.on("disconnect", (reason) => {
        console.log(`❌ Socket disconnected: ${socket.id}, Reason: ${reason}`);
      });

      socket.on("error", (error) => {
        console.error(`🔴 Socket error on ${socket.id}:`, error);
      });
    });

    console.log("🔌 Socket.IO initialized successfully");
  }

  emitToUser(userId, event, data) {
    if (!this.io) {
      console.error("❌ Socket.IO not initialized!");
      return;
    }

    if (!userId) {
      console.error("❌ No userId provided for socket emission");
      return;
    }

    const room = userId.toString();

    // Check if anyone is in the room
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    const clientCount = socketsInRoom ? socketsInRoom.size : 0;

    console.log(
      `📡 Emitting to room ${room}, event: ${event}, clients in room: ${clientCount}`
    );

    if (clientCount === 0) {
      console.warn(
        `⚠️  No clients in room ${room}! Event ${event} will not be received.`
      );
    } else {
      console.log(
        `✅ Emitting ${event} to ${clientCount} client(s) in room ${room}:`,
        data
      );
    }

    this.io.to(room).emit(event, data);
  }

  emitUploadProgress(userId, videoId, progress) {
    this.emitToUser(userId, "video-upload-progress", {
      videoId: videoId.toString(),
      progress,
    });
  }

  emitAnalysisProgress(userId, videoId, progress, detectedLabels = []) {
    this.emitToUser(userId, "video-analysis-progress", {
      videoId: videoId.toString(),
      progress,
      detectedLabels,
    });
  }

  emitStatus(userId, videoId, status, sensitivityStatus) {
    this.emitToUser(userId, "video-status", {
      videoId: videoId.toString(),
      status,
      sensitivityStatus,
    });
  }
}

module.exports = new SocketService();
