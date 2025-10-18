import { PrismaClient, ChatRequestStatus } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Simple encryption/decryption (can be replaced with more robust solution)
const ENCRYPTION_KEY =
  process.env.CHAT_ENCRYPTION_KEY || "default-key-32-characters-long!";
const ALGORITHM = "aes-256-cbc";

function encryptMessage(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptMessage(text: string): string {
  try {
    // Check if text is in encrypted format (iv:encryptedText)
    if (!text || !text.includes(":")) {
      return text; // Return as-is if not encrypted
    }

    const parts = text.split(":");
    if (parts.length !== 2) {
      return text; // Return as-is if format is invalid
    }

    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];

    // Validate IV length (should be 16 bytes = 32 hex characters)
    if (iv.length !== 16) {
      console.warn("Invalid IV length, returning original text");
      return text;
    }

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
      iv
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return text; // Return original text if decryption fails
  }
}

export class ChatService {
  /**
   * Create a new chat room request
   */
  static async createChatRoom(
    citizenId: string,
    driverId: string
  ): Promise<any> {
    // Check if driver profile exists and is available
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isActive: true,
            isBlocked: true,
          },
        },
      },
    });

    if (!driverProfile) {
      throw new Error("Driver profile not found");
    }

    if (!driverProfile.user.isActive || driverProfile.user.isBlocked) {
      throw new Error("Driver is not available for chat");
    }

    // Check if citizen exists
    const citizen = await prisma.user.findUnique({
      where: { id: citizenId },
    });

    if (!citizen || !citizen.isActive || citizen.isBlocked) {
      throw new Error("Citizen is not valid");
    }

    // Check if chat room already exists
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        citizenId,
        driverId,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    if (existingRoom) {
      return {
        ...existingRoom,
        citizen: {
          ...existingRoom.citizen,
          profileImageUrl: existingRoom.citizen.profileImage,
        },
        driver: {
          ...existingRoom.driver,
          profileImageUrl: existingRoom.driver.profileImage,
        },
      };
    }

    // Create new chat room
    const newRoom = await prisma.chatRoom.create({
      data: {
        citizenId,
        driverId,
        status: ChatRequestStatus.PENDING,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      ...newRoom,
      citizen: {
        ...newRoom.citizen,
        profileImageUrl: newRoom.citizen.profileImage,
      },
      driver: {
        ...newRoom.driver,
        profileImageUrl: newRoom.driver.profileImage,
      },
    };
  }

  /**
   * Accept chat request
   */
  static async acceptChatRequest(roomId: string, userId: string): Promise<any> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Only the driver can accept chat requests
    if (room.driverId !== userId) {
      throw new Error("Only the driver can accept chat requests");
    }

    if (room.status !== ChatRequestStatus.PENDING) {
      throw new Error("Chat request is not pending");
    }

    return await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        status: ChatRequestStatus.ACCEPTED,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * Reject chat request
   */
  static async rejectChatRequest(roomId: string, userId: string): Promise<any> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Only the driver can reject chat requests
    if (room.driverId !== userId) {
      throw new Error("Only the driver can reject chat requests");
    }

    if (room.status !== ChatRequestStatus.PENDING) {
      throw new Error("Chat request is not pending");
    }

    return await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        status: ChatRequestStatus.REJECTED,
      },
    });
  }

  /**
   * Get user's chat rooms
   */
  static async getMyChatRooms(userId: string): Promise<any[]> {
    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [{ citizenId: userId }, { driverId: userId }],
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get last message
          select: {
            id: true,
            message: true,
            messageType: true,
            mediaUrl: true,
            encrypted: true,
            read: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Decrypt last message for each room and map profile images
    return rooms.map((room) => ({
      ...room,
      citizen: {
        ...room.citizen,
        profileImageUrl: room.citizen.profileImage,
      },
      driver: {
        ...room.driver,
        profileImageUrl: room.driver.profileImage,
      },
      messages: room.messages.map((msg) => ({
        ...msg,
        message: msg.encrypted ? decryptMessage(msg.message) : msg.message,
        mediaUrl:
          msg.mediaUrl && msg.encrypted
            ? decryptMessage(msg.mediaUrl)
            : msg.mediaUrl,
      })),
    }));
  }

  /**
   * Get specific chat room
   */
  static async getChatRoom(roomId: string, userId: string): Promise<any> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Verify user is part of the chat
    if (room.citizenId !== userId && room.driverId !== userId) {
      throw new Error("Unauthorized access to chat room");
    }

    // Map profile images
    return {
      ...room,
      citizen: {
        ...room.citizen,
        profileImageUrl: room.citizen.profileImage,
      },
      driver: {
        ...room.driver,
        profileImageUrl: room.driver.profileImage,
      },
    };
  }

  /**
   * Send message in chat room
   */
  static async sendMessage(
    roomId: string,
    senderId: string,
    message: string,
    messageType: string = "TEXT",
    mediaUrl?: string
  ): Promise<any> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Verify user is part of the chat
    if (room.citizenId !== senderId && room.driverId !== senderId) {
      throw new Error("Unauthorized to send message in this chat");
    }

    // Only allow messages in accepted chats
    if (room.status !== ChatRequestStatus.ACCEPTED) {
      throw new Error("Chat request must be accepted before sending messages");
    }

    // Trim and validate message
    const trimmedMessage = message ? message.trim() : "";

    // Encrypt message and media URL if provided (only encrypt non-empty strings)
    const encryptedMessage = trimmedMessage
      ? encryptMessage(trimmedMessage)
      : "";
    const encryptedMediaUrl = mediaUrl ? encryptMessage(mediaUrl) : null;

    // Create message
    const newMessage = await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        senderId,
        message: encryptedMessage,
        messageType: messageType as any, // Cast to enum type
        mediaUrl: encryptedMediaUrl,
        encrypted: true,
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
      },
    });

    // Update chat room's updatedAt
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // Decrypt for response
    return {
      ...newMessage,
      message: decryptMessage(newMessage.message),
      mediaUrl: newMessage.mediaUrl
        ? decryptMessage(newMessage.mediaUrl)
        : null,
      sender: {
        ...newMessage.sender,
        profileImageUrl: newMessage.sender.profileImage,
      },
    };
  }

  /**
   * Get messages from a chat room
   */
  static async getMessages(
    roomId: string,
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<any[]> {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Verify user is part of the chat
    if (room.citizenId !== userId && room.driverId !== userId) {
      throw new Error("Unauthorized access to chat messages");
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    });

    // Decrypt all messages and media URLs
    return messages.map((msg) => ({
      ...msg,
      message: msg.encrypted ? decryptMessage(msg.message) : msg.message,
      mediaUrl:
        msg.mediaUrl && msg.encrypted
          ? decryptMessage(msg.mediaUrl)
          : msg.mediaUrl,
      sender: {
        ...msg.sender,
        profileImageUrl: msg.sender.profileImage,
      },
    }));
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<any> {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        chatRoom: true,
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user is the recipient
    if (message.senderId === userId) {
      throw new Error("Cannot mark own message as read");
    }

    const room = message.chatRoom;
    if (room.citizenId !== userId && room.driverId !== userId) {
      throw new Error("Unauthorized access");
    }

    return await prisma.chatMessage.update({
      where: { id: messageId },
      data: { read: true },
    });
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.chatMessage.count({
      where: {
        read: false,
        senderId: { not: userId },
        chatRoom: {
          OR: [{ citizenId: userId }, { driverId: userId }],
        },
      },
    });

    return count;
  }
}
