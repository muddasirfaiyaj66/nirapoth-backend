import { PrismaClient, VehicleAssignmentStatus, DriverStatus, } from "@prisma/client";
const prisma = new PrismaClient();
export class DriverAssignmentService {
    /**
     * Create a new vehicle assignment (vehicle owner assigns driver)
     */
    static async createAssignment(data) {
        // Verify vehicle exists and belongs to owner
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: data.vehicleId },
        });
        if (!vehicle) {
            throw new Error("Vehicle not found");
        }
        if (vehicle.ownerId !== data.ownerId) {
            throw new Error("You don't own this vehicle");
        }
        // Verify driver profile exists and is available
        const driverProfile = await prisma.driverProfile.findUnique({
            where: { userId: data.driverId },
            include: {
                user: {
                    select: {
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
            throw new Error("Driver is not available");
        }
        if (driverProfile.status === DriverStatus.ASSIGNED) {
            throw new Error("Driver is already assigned to another vehicle");
        }
        // Check for existing active assignment for this vehicle
        const existingAssignment = await prisma.vehicleAssignment.findFirst({
            where: {
                vehicleId: data.vehicleId,
                status: {
                    in: [VehicleAssignmentStatus.PENDING, VehicleAssignmentStatus.ACTIVE],
                },
            },
        });
        if (existingAssignment) {
            throw new Error("Vehicle already has an active or pending assignment");
        }
        // Create assignment
        return await prisma.vehicleAssignment.create({
            data: {
                vehicleId: data.vehicleId,
                driverId: data.driverId,
                ownerId: data.ownerId,
                salary: data.salary,
                startDate: data.startDate,
                notes: data.notes,
                status: VehicleAssignmentStatus.PENDING,
            },
            include: {
                vehicle: {
                    select: {
                        plateNo: true,
                        type: true,
                        brand: true,
                        model: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                    },
                },
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    }
    /**
     * Accept vehicle assignment (driver accepts the offer)
     */
    static async acceptAssignment(assignmentId, userId) {
        const assignment = await prisma.vehicleAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) {
            throw new Error("Assignment not found");
        }
        // Only the driver can accept
        if (assignment.driverId !== userId) {
            throw new Error("Only the assigned driver can accept this assignment");
        }
        if (assignment.status !== VehicleAssignmentStatus.PENDING) {
            throw new Error("Assignment is not pending");
        }
        // Update assignment and driver status in a transaction
        const [updatedAssignment] = await prisma.$transaction([
            prisma.vehicleAssignment.update({
                where: { id: assignmentId },
                data: {
                    status: VehicleAssignmentStatus.ACTIVE,
                    startDate: assignment.startDate || new Date(),
                },
                include: {
                    vehicle: {
                        select: {
                            plateNo: true,
                            type: true,
                            brand: true,
                            model: true,
                        },
                    },
                    driver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            }),
            prisma.driverProfile.update({
                where: { userId: userId },
                data: { status: DriverStatus.ASSIGNED },
            }),
        ]);
        return updatedAssignment;
    }
    /**
     * Reject vehicle assignment (driver rejects the offer)
     */
    static async rejectAssignment(assignmentId, userId) {
        const assignment = await prisma.vehicleAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) {
            throw new Error("Assignment not found");
        }
        // Only the driver can reject
        if (assignment.driverId !== userId) {
            throw new Error("Only the assigned driver can reject this assignment");
        }
        if (assignment.status !== VehicleAssignmentStatus.PENDING) {
            throw new Error("Assignment is not pending");
        }
        return await prisma.vehicleAssignment.update({
            where: { id: assignmentId },
            data: {
                status: VehicleAssignmentStatus.REJECTED,
            },
        });
    }
    /**
     * Resign from assignment (driver quits)
     */
    static async resignFromAssignment(assignmentId, userId) {
        const assignment = await prisma.vehicleAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) {
            throw new Error("Assignment not found");
        }
        // Only the driver can resign
        if (assignment.driverId !== userId) {
            throw new Error("Only the assigned driver can resign");
        }
        if (assignment.status !== VehicleAssignmentStatus.ACTIVE) {
            throw new Error("Assignment is not active");
        }
        // Update assignment and driver status in a transaction
        const [updatedAssignment] = await prisma.$transaction([
            prisma.vehicleAssignment.update({
                where: { id: assignmentId },
                data: {
                    status: VehicleAssignmentStatus.RESIGNED,
                    endDate: new Date(),
                },
                include: {
                    vehicle: {
                        select: {
                            plateNo: true,
                            type: true,
                            brand: true,
                            model: true,
                        },
                    },
                    driver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.driverProfile.update({
                where: { userId: userId },
                data: { status: DriverStatus.AVAILABLE },
            }),
        ]);
        return updatedAssignment;
    }
    /**
     * Terminate assignment (owner fires driver)
     */
    static async terminateAssignment(assignmentId, userId) {
        const assignment = await prisma.vehicleAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) {
            throw new Error("Assignment not found");
        }
        // Only the owner can terminate
        if (assignment.ownerId !== userId) {
            throw new Error("Only the vehicle owner can terminate this assignment");
        }
        if (assignment.status !== VehicleAssignmentStatus.ACTIVE) {
            throw new Error("Assignment is not active");
        }
        // Update assignment and driver status in a transaction
        const [updatedAssignment] = await prisma.$transaction([
            prisma.vehicleAssignment.update({
                where: { id: assignmentId },
                data: {
                    status: VehicleAssignmentStatus.TERMINATED,
                    endDate: new Date(),
                },
                include: {
                    vehicle: {
                        select: {
                            plateNo: true,
                            type: true,
                            brand: true,
                            model: true,
                        },
                    },
                    driver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            prisma.driverProfile.update({
                where: { userId: assignment.driverId },
                data: { status: DriverStatus.AVAILABLE },
            }),
        ]);
        return updatedAssignment;
    }
    /**
     * Get user's assignments (as driver or owner)
     */
    static async getMyAssignments(userId) {
        const asDriver = await prisma.vehicleAssignment.findMany({
            where: { driverId: userId },
            include: {
                vehicle: {
                    select: {
                        plateNo: true,
                        type: true,
                        brand: true,
                        model: true,
                    },
                },
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const asOwner = await prisma.vehicleAssignment.findMany({
            where: { ownerId: userId },
            include: {
                vehicle: {
                    select: {
                        plateNo: true,
                        type: true,
                        brand: true,
                        model: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        citizenGem: { select: { amount: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return { asDriver, asOwner };
    }
    /**
     * Get specific assignment
     */
    static async getAssignment(assignmentId, userId) {
        const assignment = await prisma.vehicleAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                vehicle: {
                    select: {
                        plateNo: true,
                        type: true,
                        brand: true,
                        model: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        citizenGem: { select: { amount: true,
                            },
                        },
                    },
                },
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                    },
                },
            },
        });
        if (!assignment) {
            throw new Error("Assignment not found");
        }
        // Verify user is involved in this assignment
        if (assignment.driverId !== userId && assignment.ownerId !== userId) {
            throw new Error("Unauthorized access to this assignment");
        }
        return assignment;
    }
    /**
     * Get assignments for a specific vehicle
     */
    static async getVehicleAssignments(vehicleId, userId) {
        // Verify vehicle ownership
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            throw new Error("Vehicle not found");
        }
        if (vehicle.ownerId !== userId) {
            throw new Error("Unauthorized access to vehicle assignments");
        }
        return await prisma.vehicleAssignment.findMany({
            where: { vehicleId },
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        citizenGem: { select: { amount: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Get assignments for a specific driver
     */
    static async getDriverAssignments(driverId) {
        return await prisma.vehicleAssignment.findMany({
            where: { driverId },
            include: {
                vehicle: {
                    select: {
                        plateNo: true,
                        type: true,
                        brand: true,
                        model: true,
                    },
                },
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
}
