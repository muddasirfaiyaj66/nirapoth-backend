-- CreateTable
CREATE TABLE "official_chat_rooms" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_chat_messages" (
    "id" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "official_chat_rooms_user1Id_idx" ON "official_chat_rooms"("user1Id");

-- CreateIndex
CREATE INDEX "official_chat_rooms_user2Id_idx" ON "official_chat_rooms"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "official_chat_rooms_user1Id_user2Id_key" ON "official_chat_rooms"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "official_chat_messages_chatRoomId_idx" ON "official_chat_messages"("chatRoomId");

-- CreateIndex
CREATE INDEX "official_chat_messages_senderId_idx" ON "official_chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "official_chat_messages_createdAt_idx" ON "official_chat_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "official_chat_rooms" ADD CONSTRAINT "official_chat_rooms_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_chat_rooms" ADD CONSTRAINT "official_chat_rooms_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_chat_messages" ADD CONSTRAINT "official_chat_messages_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "official_chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_chat_messages" ADD CONSTRAINT "official_chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
