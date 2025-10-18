import type { Request, Response } from "express";
import { ChatService } from "../services/chat.service";
import { NotificationService } from "../services/notification.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createChatRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const citizenId = req.user?.id;
    if (!citizenId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { driverId } = req.body;
    if (!driverId) {
      res.status(400).json({
        success: false,
        message: "Driver ID is required",
      });
      return;
    }

    const chatRoom = await ChatService.createChatRoom(citizenId, driverId);

    // Send notification to driver
    const citizen = await prisma.user.findUnique({
      where: { id: citizenId },
      select: { firstName: true, lastName: true },
    });
    if (citizen) {
      await NotificationService.notifyChatRequestReceived(
        driverId,
        `${citizen.firstName} ${citizen.lastName}`,
        chatRoom.id
      ).catch((err) => console.error("Failed to send notification:", err));
    }

    res.status(201).json({
      success: true,
      message: "Chat room created successfully",
      data: chatRoom,
    });
  } catch (error: any) {
    console.error("Error creating chat room:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create chat room",
    });
  }
};

export const acceptChatRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { roomId } = req.params;
    const chatRoom = await ChatService.acceptChatRequest(roomId, userId);

    // Send notification to citizen
    const driver = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    if (driver) {
      await NotificationService.notifyChatRequestAccepted(
        chatRoom.citizenId,
        `${driver.firstName} ${driver.lastName}`,
        roomId
      ).catch((err) => console.error("Failed to send notification:", err));
    }

    res.status(200).json({
      success: true,
      message: "Chat request accepted successfully",
      data: chatRoom,
    });
  } catch (error: any) {
    console.error("Error accepting chat request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to accept chat request",
    });
  }
};

export const rejectChatRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { roomId } = req.params;
    const chatRoom = await ChatService.rejectChatRequest(roomId, userId);

    // Send notification to citizen
    const driver = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    if (driver) {
      await NotificationService.notifyChatRequestRejected(
        chatRoom.citizenId,
        `${driver.firstName} ${driver.lastName}`
      ).catch((err) => console.error("Failed to send notification:", err));
    }

    res.status(200).json({
      success: true,
      message: "Chat request rejected successfully",
      data: chatRoom,
    });
  } catch (error: any) {
    console.error("Error rejecting chat request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject chat request",
    });
  }
};

export const getMyChatRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const chatRooms = await ChatService.getMyChatRooms(userId);

    res.status(200).json({
      success: true,
      count: chatRooms.length,
      data: chatRooms,
    });
  } catch (error: any) {
    console.error("Error getting chat rooms:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get chat rooms",
    });
  }
};

export const getChatRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { roomId } = req.params;
    const chatRoom = await ChatService.getChatRoom(roomId, userId);

    res.status(200).json({
      success: true,
      data: chatRoom,
    });
  } catch (error: any) {
    console.error("Error getting chat room:", error);
    res
      .status(error.message === "Unauthorized access to chat room" ? 403 : 404)
      .json({
        success: false,
        message: error.message || "Failed to get chat room",
      });
  }
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { roomId } = req.params;
    const { message, messageType = "TEXT", mediaUrl } = req.body;

    console.log("📨 Send Message Request:", {
      roomId,
      userId,
      messageType: typeof message,
      messageValue: message,
      messageLength: message?.length,
      mediaUrl,
      bodyKeys: Object.keys(req.body),
    });

    // Validate message types
    if (
      typeof message !== "string" &&
      message !== null &&
      message !== undefined
    ) {
      console.error("❌ Message type error:", typeof message);
      res.status(400).json({
        success: false,
        message: "Message must be a string",
      });
      return;
    }

    if (mediaUrl && typeof mediaUrl !== "string") {
      console.error("❌ Media URL type error:", typeof mediaUrl);
      res.status(400).json({
        success: false,
        message: "Media URL must be a string",
      });
      return;
    }

    // Trim message
    const trimmedMessage = message ? message.trim() : "";

    // Validate message (allow empty for media messages)
    if (!trimmedMessage && !mediaUrl) {
      console.error("❌ Empty message error");
      res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
      return;
    }

    const newMessage = await ChatService.sendMessage(
      roomId,
      userId,
      trimmedMessage,
      messageType,
      mediaUrl
    );

    // Send notification to the other user
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    const recipientId =
      chatRoom?.citizenId === userId ? chatRoom?.driverId : chatRoom?.citizenId;

    if (recipientId) {
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (sender) {
        await NotificationService.notifyNewMessage(
          recipientId,
          `${sender.firstName} ${sender.lastName}`,
          roomId
        ).catch((err) => console.error("Failed to send notification:", err));
      }
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { roomId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;

    const messages = await ChatService.getMessages(roomId, userId, limit, skip);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error: any) {
    console.error("Error getting messages:", error);
    res
      .status(
        error.message === "Unauthorized access to chat messages" ? 403 : 404
      )
      .json({
        success: false,
        message: error.message || "Failed to get messages",
      });
  }
};

export const markMessageAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { messageId } = req.params;
    const message = await ChatService.markMessageAsRead(messageId, userId);

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message,
    });
  } catch (error: any) {
    console.error("Error marking message as read:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to mark message as read",
    });
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const count = await ChatService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get unread count",
    });
  }
};
