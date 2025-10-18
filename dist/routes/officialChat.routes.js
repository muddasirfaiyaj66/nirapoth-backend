"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const userActivity_middleware_1 = require("../middleware/userActivity.middleware");
const officialChatController = __importStar(require("../controllers/officialChat.controller"));
const router = express_1.default.Router();
// Apply authentication and activity tracking to all official chat routes
router.use(auth_middleware_1.authenticate, userActivity_middleware_1.updateUserActivity);
// Middleware to check if user is an official
const checkOfficialRole = (req, res, next) => {
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
router.post("/room/create", checkOfficialRole, officialChatController.createOrGetChatRoom);
router.get("/rooms", checkOfficialRole, officialChatController.getMyChatRooms);
router.get("/room/:roomId", checkOfficialRole, officialChatController.getChatRoom);
// Messages
router.post("/room/:roomId/message", checkOfficialRole, officialChatController.sendMessage);
router.get("/room/:roomId/messages", checkOfficialRole, officialChatController.getMessages);
router.patch("/message/:messageId/read", checkOfficialRole, officialChatController.markMessageAsRead);
router.get("/unread-count", checkOfficialRole, officialChatController.getUnreadCount);
// Get list of officials to chat with
router.get("/available-officials", checkOfficialRole, officialChatController.getAvailableOfficials);
exports.default = router;
