"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableOfficials = exports.getUnreadCount = exports.markMessageAsRead = exports.getMessages = exports.sendMessage = exports.getChatRoom = exports.getMyChatRooms = exports.createOrGetChatRoom = void 0;
const officialChat_service_1 = require("../services/officialChat.service");
const notification_service_1 = require("../services/notification.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createOrGetChatRoom = async (req, res) => {
    try {
        const user1Id = req.user?.id;
        if (!user1Id) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { user2Id } = req.body;
        if (!user2Id) {
            res.status(400).json({
                success: false,
                message: "User ID is required",
            });
            return;
        }
        const chatRoom = await officialChat_service_1.OfficialChatService.createOrGetChatRoom(user1Id, user2Id);
        res.status(201).json({
            success: true,
            message: "Chat room retrieved successfully",
            data: chatRoom,
        });
    }
    catch (error) {
        console.error("Error creating/getting chat room:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to create chat room",
        });
    }
};
exports.createOrGetChatRoom = createOrGetChatRoom;
const getMyChatRooms = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const chatRooms = await officialChat_service_1.OfficialChatService.getMyChatRooms(userId);
        res.status(200).json({
            success: true,
            count: chatRooms.length,
            data: chatRooms,
        });
    }
    catch (error) {
        console.error("Error getting chat rooms:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get chat rooms",
        });
    }
};
exports.getMyChatRooms = getMyChatRooms;
const getChatRoom = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { roomId } = req.params;
        const chatRoom = await officialChat_service_1.OfficialChatService.getChatRoom(roomId, userId);
        res.status(200).json({
            success: true,
            data: chatRoom,
        });
    }
    catch (error) {
        console.error("Error getting chat room:", error);
        res
            .status(error.message === "Unauthorized access to chat room" ? 403 : 404)
            .json({
            success: false,
            message: error.message || "Failed to get chat room",
        });
    }
};
exports.getChatRoom = getChatRoom;
const sendMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { roomId } = req.params;
        const { message, messageType = "TEXT", mediaUrl } = req.body;
        // Validate message (allow empty for media messages)
        if (!message && !mediaUrl) {
            res.status(400).json({
                success: false,
                message: "Message or media is required",
            });
            return;
        }
        const newMessage = await officialChat_service_1.OfficialChatService.sendMessage(roomId, userId, message || "", messageType, mediaUrl);
        // Send notification to the other user
        const chatRoom = await prisma.officialChatRoom.findUnique({
            where: { id: roomId },
        });
        const recipientId = chatRoom?.user1Id === userId ? chatRoom?.user2Id : chatRoom?.user1Id;
        if (recipientId) {
            const sender = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true },
            });
            if (sender) {
                await notification_service_1.NotificationService.notifyNewMessage(recipientId, `${sender.firstName} ${sender.lastName}`, roomId).catch((err) => console.error("Failed to send notification:", err));
            }
        }
        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage,
        });
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to send message",
        });
    }
};
exports.sendMessage = sendMessage;
const getMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { roomId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const skip = req.query.skip ? parseInt(req.query.skip) : 0;
        const messages = await officialChat_service_1.OfficialChatService.getMessages(roomId, userId, limit, skip);
        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages,
        });
    }
    catch (error) {
        console.error("Error getting messages:", error);
        res
            .status(error.message === "Unauthorized access to chat messages" ? 403 : 404)
            .json({
            success: false,
            message: error.message || "Failed to get messages",
        });
    }
};
exports.getMessages = getMessages;
const markMessageAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { messageId } = req.params;
        const message = await officialChat_service_1.OfficialChatService.markMessageAsRead(messageId, userId);
        res.status(200).json({
            success: true,
            message: "Message marked as read",
            data: message,
        });
    }
    catch (error) {
        console.error("Error marking message as read:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to mark message as read",
        });
    }
};
exports.markMessageAsRead = markMessageAsRead;
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const count = await officialChat_service_1.OfficialChatService.getUnreadCount(userId);
        res.status(200).json({
            success: true,
            data: { count },
        });
    }
    catch (error) {
        console.error("Error getting unread count:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get unread count",
        });
    }
};
exports.getUnreadCount = getUnreadCount;
const getAvailableOfficials = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const officials = await officialChat_service_1.OfficialChatService.getAvailableOfficials(userId);
        res.status(200).json({
            success: true,
            count: officials.length,
            data: officials,
        });
    }
    catch (error) {
        console.error("Error getting available officials:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get available officials",
        });
    }
};
exports.getAvailableOfficials = getAvailableOfficials;
