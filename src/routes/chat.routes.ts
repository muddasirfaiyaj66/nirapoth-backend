import express from "express";
import {
  createChatRoom,
  getMyChatRooms,
  getChatRoom,
  sendMessage,
  getMessages,
  acceptChatRequest,
  rejectChatRequest,
  markMessageAsRead,
  getUnreadCount,
} from "../controllers/chat.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { updateUserActivity } from "../middleware/userActivity.middleware";

const router = express.Router();

// Apply authentication and activity tracking to all chat routes
router.use(authenticateToken, updateUserActivity);

/**
 * @route   POST /api/chat/room
 * @desc    Create a new chat room between citizen and driver
 * @access  Private (Citizen only)
 */
router.post("/room", createChatRoom);

/**
 * @route   GET /api/chat/my-rooms
 * @desc    Get all chat rooms for the current user
 * @access  Private
 */
router.get("/my-rooms", getMyChatRooms);

/**
 * @route   GET /api/chat/rooms
 * @desc    Get all chat rooms for the current user (alias for /my-rooms)
 * @access  Private
 */
router.get("/rooms", getMyChatRooms);

/**
 * @route   GET /api/chat/room/:roomId
 * @desc    Get a specific chat room
 * @access  Private
 */
router.get("/room/:roomId", getChatRoom);

/**
 * @route   POST /api/chat/room/:roomId/message
 * @desc    Send a message in a chat room
 * @access  Private
 */
router.post("/room/:roomId/message", sendMessage);

/**
 * @route   GET /api/chat/room/:roomId/messages
 * @desc    Get messages from a chat room
 * @access  Private
 */
router.get("/room/:roomId/messages", getMessages);

/**
 * @route   PATCH /api/chat/room/:roomId/accept
 * @desc    Accept a chat request (Driver only)
 * @access  Private
 */
router.patch("/room/:roomId/accept", acceptChatRequest);

/**
 * @route   PATCH /api/chat/room/:roomId/reject
 * @desc    Reject a chat request (Driver only)
 * @access  Private
 */
router.patch("/room/:roomId/reject", rejectChatRequest);

/**
 * @route   PATCH /api/chat/message/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.patch("/message/:messageId/read", markMessageAsRead);

/**
 * @route   GET /api/chat/unread-count
 * @desc    Get unread message count for the current user
 * @access  Private
 */
router.get("/unread-count", getUnreadCount);

export default router;
