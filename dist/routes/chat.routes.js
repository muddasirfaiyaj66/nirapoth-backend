"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const userActivity_middleware_1 = require("../middleware/userActivity.middleware");
const router = (0, express_1.Router)();
// Apply authentication and activity tracking to all chat routes
router.use(auth_middleware_1.authenticateToken, userActivity_middleware_1.updateUserActivity);
/**
 * @route   POST /api/chat/room
 * @desc    Create a new chat room between citizen and driver
 * @access  Private (Citizen only)
 */
router.post("/room", chat_controller_1.createChatRoom);
/**
 * @route   GET /api/chat/my-rooms
 * @desc    Get all chat rooms for the current user
 * @access  Private
 */
router.get("/my-rooms", chat_controller_1.getMyChatRooms);
/**
 * @route   GET /api/chat/rooms
 * @desc    Get all chat rooms for the current user (alias for /my-rooms)
 * @access  Private
 */
router.get("/rooms", chat_controller_1.getMyChatRooms);
/**
 * @route   GET /api/chat/room/:roomId
 * @desc    Get a specific chat room
 * @access  Private
 */
router.get("/room/:roomId", chat_controller_1.getChatRoom);
/**
 * @route   POST /api/chat/room/:roomId/message
 * @desc    Send a message in a chat room
 * @access  Private
 */
router.post("/room/:roomId/message", chat_controller_1.sendMessage);
/**
 * @route   GET /api/chat/room/:roomId/messages
 * @desc    Get messages from a chat room
 * @access  Private
 */
router.get("/room/:roomId/messages", chat_controller_1.getMessages);
/**
 * @route   PATCH /api/chat/room/:roomId/accept
 * @desc    Accept a chat request (Driver only)
 * @access  Private
 */
router.patch("/room/:roomId/accept", chat_controller_1.acceptChatRequest);
/**
 * @route   PATCH /api/chat/room/:roomId/reject
 * @desc    Reject a chat request (Driver only)
 * @access  Private
 */
router.patch("/room/:roomId/reject", chat_controller_1.rejectChatRequest);
/**
 * @route   PATCH /api/chat/message/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.patch("/message/:messageId/read", chat_controller_1.markMessageAsRead);
/**
 * @route   GET /api/chat/unread-count
 * @desc    Get unread message count for the current user
 * @access  Private
 */
router.get("/unread-count", chat_controller_1.getUnreadCount);
exports.default = router;
