"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
exports.getIO = getIO;
exports.sendNotificationToUser = sendNotificationToUser;
exports.sendNotificationToRole = sendNotificationToRole;
exports.broadcastNotification = broadcastNotification;
exports.sendUrgentNotification = sendUrgentNotification;
exports.broadcastUrgentNotification = broadcastUrgentNotification;
exports.getConnectedUsersCount = getConnectedUsersCount;
exports.isUserConnected = isUserConnected;
const socket_io_1 = require("socket.io");
const env_1 = require("./env");
let io = null;
/**
 * Initialize Socket.IO server
 */
function initializeSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.config.cors.origin || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
        // Prioritize polling for Vercel compatibility (Hobby plan doesn't support WebSockets)
        transports: ["polling", "websocket"],
        // Allow upgrade to websocket if available (won't work on Vercel Hobby, but will try)
        allowUpgrades: true,
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    io.on("connection", (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);
        // Handle user authentication
        socket.on("authenticate", (data) => {
            socket.userId = data.userId;
            socket.userRole = data.role;
            // Join user-specific room
            socket.join(`user:${data.userId}`);
            // Join role-specific room
            socket.join(`role:${data.role}`);
            console.log(`✅ User authenticated: ${data.userId} (${data.role})`);
            socket.emit("authenticated", {
                success: true,
                message: "Successfully authenticated",
            });
        });
        // Handle disconnect
        socket.on("disconnect", () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
        // Handle errors
        socket.on("error", (error) => {
            console.error(`❌ Socket error for ${socket.id}:`, error);
        });
    });
    console.log("🔌 Socket.IO server initialized");
    return io;
}
/**
 * Get Socket.IO server instance
 */
function getIO() {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initializeSocket first.");
    }
    return io;
}
/**
 * Send notification to specific user
 */
function sendNotificationToUser(userId, notification) {
    if (!io) {
        console.warn("Socket.IO not initialized");
        return;
    }
    io.to(`user:${userId}`).emit("notification:new", notification);
    console.log(`📨 Notification sent to user: ${userId}`);
}
/**
 * Send notification to all users with specific role
 */
function sendNotificationToRole(role, notification) {
    if (!io) {
        console.warn("Socket.IO not initialized");
        return;
    }
    io.to(`role:${role}`).emit("notification:new", notification);
    console.log(`📨 Notification sent to role: ${role}`);
}
/**
 * Broadcast notification to all connected users
 */
function broadcastNotification(notification) {
    if (!io) {
        console.warn("Socket.IO not initialized");
        return;
    }
    io.emit("notification:new", notification);
    console.log(`📢 Notification broadcast to all users`);
}
/**
 * Send urgent/emergency notification with special flag
 */
function sendUrgentNotification(userId, notification) {
    if (!io) {
        console.warn("Socket.IO not initialized");
        return;
    }
    io.to(`user:${userId}`).emit("notification:urgent", notification);
    console.log(`🚨 URGENT notification sent to user: ${userId}`);
}
/**
 * Broadcast urgent notification to all users
 */
function broadcastUrgentNotification(notification) {
    if (!io) {
        console.warn("Socket.IO not initialized");
        return;
    }
    io.emit("notification:urgent", notification);
    console.log(`🚨 URGENT notification broadcast to all users`);
}
/**
 * Get count of connected users
 */
function getConnectedUsersCount() {
    if (!io) {
        return 0;
    }
    return io.sockets.sockets.size;
}
/**
 * Check if user is connected
 */
async function isUserConnected(userId) {
    if (!io) {
        return false;
    }
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    return sockets.length > 0;
}
