import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { updateUserActivity } from "../middleware/userActivity.middleware";
import * as officialChatController from "../controllers/officialChat.controller";

const router = express.Router();

// Apply authentication and activity tracking to all official chat routes
router.use(authenticate, updateUserActivity);

// Middleware to check if user is an official
const checkOfficialRole = (req: any, res: any, next: any) => {
  const officialRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "POLICE",
    "FIRE_SERVICE",
    "CITY_CORPORATION",
  ];
  if (!req.user || !officialRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Officials only.",
    });
  }
  next();
};

// Chat room management
router.post(
  "/room/create",
  checkOfficialRole,
  officialChatController.createOrGetChatRoom
);
router.get("/rooms", checkOfficialRole, officialChatController.getMyChatRooms);
router.get(
  "/room/:roomId",
  checkOfficialRole,
  officialChatController.getChatRoom
);

// Messages
router.post(
  "/room/:roomId/message",
  checkOfficialRole,
  officialChatController.sendMessage
);
router.get(
  "/room/:roomId/messages",
  checkOfficialRole,
  officialChatController.getMessages
);
router.patch(
  "/message/:messageId/read",
  checkOfficialRole,
  officialChatController.markMessageAsRead
);
router.get(
  "/unread-count",
  checkOfficialRole,
  officialChatController.getUnreadCount
);

// Get list of officials to chat with
router.get(
  "/available-officials",
  checkOfficialRole,
  officialChatController.getAvailableOfficials
);

export default router;
