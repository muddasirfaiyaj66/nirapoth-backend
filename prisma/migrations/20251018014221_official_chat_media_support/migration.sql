-- AlterTable
ALTER TABLE "official_chat_messages" ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "messageType" "MessageType" NOT NULL DEFAULT 'TEXT';
