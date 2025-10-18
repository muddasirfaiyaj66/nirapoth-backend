import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Encryption key from environment (use the same as regular chat)
const ENCRYPTION_KEY =
  process.env.CHAT_ENCRYPTION_KEY || "your-32-character-secret-key!!";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function encryptMessage(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
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
    if (parts.length < 2) {
      return text; // Return as-is if format is invalid
    }

    const iv = Buffer.from(parts.shift()!, "hex");

    // Validate IV length (should be 16 bytes)
    if (iv.length !== IV_LENGTH) {
      console.warn(
        "Invalid IV length in official chat decryption, returning original text"
      );
      return text;
    }

    const encryptedText = Buffer.from(parts.join(":"), "hex");

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
      iv
    );

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (error) {
    console.error("Official chat decryption error:", error);
    return text; // Return original text if decryption fails
  }
}

export class OfficialChatService {
  /**
   * Create or get official chat room between two users
   */
  static async createOrGetChatRoom(
    user1Id: string,
    user2Id: string
  ): Promise<any> {
    // Verify both users are officials (not citizens)
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user1Id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profileImage: true,
          isActive: true,
          isBlocked: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: user2Id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profileImage: true,
          isActive: true,
          isBlocked: true,
        },
      }),
    ]);

    if (!user1 || !user2) {
      throw new Error("User not found");
    }

    // Verify both are officials
    const officialRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "POLICE",
      "FIRE_SERVICE",
      "CITY_CORPORATION",
    ];
    if (
      !officialRoles.includes(user1.role) ||
      !officialRoles.includes(user2.role)
    ) {
      throw new Error(
        "Both users must be officials to create an official chat"
      );
    }

    if (
      !user1.isActive ||
      user1.isBlocked ||
      !user2.isActive ||
      user2.isBlocked
    ) {
      throw new Error("User is not available for chat");
    }

    // Ensure consistent ordering (smaller ID first)
    const [smallerId, largerId] = [user1Id, user2Id].sort();

    // Check if chat room already exists
    const existingRoom = await prisma.officialChatRoom.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: smallerId,
          user2Id: largerId,
        },
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    if (existingRoom) {
      return {
        ...existingRoom,
        user1: {
          ...existingRoom.user1,
          profileImageUrl: existingRoom.user1.profileImage,
        },
        user2: {
          ...existingRoom.user2,
          profileImageUrl: existingRoom.user2.profileImage,
        },
      };
    }

    // Create new chat room
    const newRoom = await prisma.officialChatRoom.create({
      data: {
        user1Id: smallerId,
        user2Id: largerId,
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      ...newRoom,
      user1: {
        ...newRoom.user1,
        profileImageUrl: newRoom.user1.profileImage,
      },
      user2: {
        ...newRoom.user2,
        profileImageUrl: newRoom.user2.profileImage,
      },
    };
  }

  /**
   * Get user's official chat rooms
   */
  static async getMyChatRooms(userId: string): Promise<any[]> {
    const rooms = await prisma.officialChatRoom.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
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

    // Decrypt last message and media URL, map profile images
    return rooms.map((room) => ({
      ...room,
      user1: {
        ...room.user1,
        profileImageUrl: room.user1.profileImage,
      },
      user2: {
        ...room.user2,
        profileImageUrl: room.user2.profileImage,
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
    const room = await prisma.officialChatRoom.findUnique({
      where: { id: roomId },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Verify user is part of the chat
    if (room.user1Id !== userId && room.user2Id !== userId) {
      throw new Error("Unauthorized access to chat room");
    }

    return {
      ...room,
      user1: {
        ...room.user1,
        profileImageUrl: room.user1.profileImage,
      },
      user2: {
        ...room.user2,
        profileImageUrl: room.user2.profileImage,
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
    const room = await prisma.officialChatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Verify user is part of the chat
    if (room.user1Id !== senderId && room.user2Id !== senderId) {
      throw new Error("Unauthorized to send message in this chat");
    }

    // Encrypt message and media URL if provided
    const encryptedMessage = encryptMessage(message);
    const encryptedMediaUrl = mediaUrl ? encryptMessage(mediaUrl) : null;

    // Create message
    const newMessage = await prisma.officialChatMessage.create({
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
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
      },
    });

    // Update chat room's updatedAt
    await prisma.officialChatRoom.update({
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
    const room = await prisma.officialChatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Chat room not found");
    }

    // Verify user is part of the chat
    if (room.user1Id !== userId && room.user2Id !== userId) {
      throw new Error("Unauthorized access to chat messages");
    }

    const messages = await prisma.officialChatMessage.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
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
    const message = await prisma.officialChatMessage.findUnique({
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

    if (
      message.chatRoom.user1Id !== userId &&
      message.chatRoom.user2Id !== userId
    ) {
      throw new Error("Unauthorized");
    }

    return await prisma.officialChatMessage.update({
      where: { id: messageId },
      data: { read: true },
    });
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.officialChatMessage.count({
      where: {
        read: false,
        senderId: { not: userId },
        chatRoom: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      },
    });

    return count;
  }

  /**
   * Get list of officials the user can chat with
   */
  static async getAvailableOfficials(userId: string): Promise<any[]> {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get all officials except the current user
    const officials = await prisma.user.findMany({
      where: {
        id: { not: userId },
        role: {
          in: ["SUPER_ADMIN", "ADMIN", "POLICE", "FIRE_SERVICE"],
        },
        isActive: true,
        isBlocked: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        profileImage: true,
        designation: true,
      },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });

    return officials.map((official) => ({
      ...official,
      profileImageUrl: official.profileImage,
    }));
  }
}
