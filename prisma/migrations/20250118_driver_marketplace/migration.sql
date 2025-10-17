-- CreateEnum for driver status
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'INACTIVE');

-- CreateEnum for vehicle assignment status
CREATE TYPE "VehicleAssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'RESIGNED', 'TERMINATED');

-- CreateEnum for chat request status
CREATE TYPE "ChatRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- Driver Profile table
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "driving_license_id" TEXT NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "expected_salary" INTEGER NOT NULL,
    "preferred_locations" TEXT[],
    "availability" TEXT NOT NULL,
    "bio" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- Chat Room table
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "status" "ChatRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- Chat Message table
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "chat_room_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- Vehicle Assignment table
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "status" "VehicleAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "salary" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "driver_profiles_user_id_key" ON "driver_profiles"("user_id");
CREATE UNIQUE INDEX "driver_profiles_driving_license_id_key" ON "driver_profiles"("driving_license_id");
CREATE UNIQUE INDEX "chat_rooms_citizen_id_driver_id_key" ON "chat_rooms"("citizen_id", "driver_id");

-- Create indexes for better query performance
CREATE INDEX "chat_rooms_citizen_id_idx" ON "chat_rooms"("citizen_id");
CREATE INDEX "chat_rooms_driver_id_idx" ON "chat_rooms"("driver_id");
CREATE INDEX "chat_messages_chat_room_id_idx" ON "chat_messages"("chat_room_id");
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");
CREATE INDEX "vehicle_assignments_vehicle_id_idx" ON "vehicle_assignments"("vehicle_id");
CREATE INDEX "vehicle_assignments_driver_id_idx" ON "vehicle_assignments"("driver_id");
CREATE INDEX "vehicle_assignments_owner_id_idx" ON "vehicle_assignments"("owner_id");

-- Add foreign key constraints
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_driving_license_id_fkey" FOREIGN KEY ("driving_license_id") REFERENCES "driving_licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

