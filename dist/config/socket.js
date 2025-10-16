import { Server as SocketIOServer } from "socket.io";
import { config } from "./env";
let io = null;
/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer) {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: config.cors.origin || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
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
export function getIO() {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initializeSocket first.");
    }
    return io;
}
/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId, notification) {
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
export function sendNotificationToRole(role, notification) {
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
export function broadcastNotification(notification) {
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
export function sendUrgentNotification(userId, notification) {
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
export function broadcastUrgentNotification(notification) {
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
export function getConnectedUsersCount() {
    if (!io) {
        return 0;
    }
    return io.sockets.sockets.size;
}
/**
 * Check if user is connected
 */
export async function isUserConnected(userId) {
    if (!io) {
        return false;
    }
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    return sockets.length > 0;
}
