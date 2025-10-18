import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export interface UserProfileUpdate {
  // Personal Information
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  profileImage?: string;

  // Contact Information
  alternatePhone?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;

  // Address Information
  presentAddress?: string;
  presentCity?: string;
  presentDistrict?: string;
  presentDivision?: string;
  presentPostalCode?: string;

  permanentAddress?: string;
  permanentCity?: string;
  permanentDistrict?: string;
  permanentDivision?: string;
  permanentPostalCode?: string;

  // Professional Information (for police/fire service)
  designation?: string;
  badgeNo?: string;
  joiningDate?: Date;
  rank?: string;
  specialization?: string;
}

export class UserProfileService {
  /**
   * Get complete user profile
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        citizenGem: true,
        drivingLicenses: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        ownerAssignments: {
          where: { status: "ACTIVE" },
          include: {
            vehicle: {
              select: {
                plateNo: true,
                type: true,
                brand: true,
                model: true,
              },
            },
          },
        },
        vehiclesOwned: {
          where: { isActive: true },
          select: {
            id: true,
            plateNo: true,
            type: true,
            brand: true,
            model: true,
          },
        },
        station: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Remove password from response
    const { password, ...userProfile } = user;
    return userProfile;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updateData: UserProfileUpdate) {
    // Validate badge number uniqueness for police
    if (updateData.badgeNo) {
      const existingBadge = await prisma.user.findFirst({
        where: {
          badgeNo: updateData.badgeNo,
          id: { not: userId },
        },
      });

      if (existingBadge) {
        throw new Error("Badge number already exists");
      }
    }

    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        alternatePhone: true,
        emergencyContact: true,
        emergencyContactPhone: true,
        presentAddress: true,
        presentCity: true,
        presentDistrict: true,
        presentDivision: true,
        presentPostalCode: true,
        permanentAddress: true,
        permanentCity: true,
        permanentDistrict: true,
        permanentDivision: true,
        permanentPostalCode: true,
        badgeNo: true,
        joiningDate: true,
        rank: true,
        specialization: true,
        profileImage: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update password
   */
  static async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Password updated successfully" };
  }

  /**
   * Get user's driving licenses
   */
  static async getUserDrivingLicenses(userId: string) {
    return await prisma.drivingLicense.findMany({
      where: {
        citizenId: userId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Add driving license to user profile
   */
  static async addDrivingLicense(
    userId: string,
    licenseData: {
      licenseNo: string;
      category:
        | "LIGHT_VEHICLE"
        | "MOTORCYCLE"
        | "LIGHT_VEHICLE_MOTORCYCLE"
        | "HEAVY_VEHICLE"
        | "PSV"
        | "GOODS_VEHICLE";
      issueDate?: Date;
      expiryDate?: Date;
      issuingAuthority: string;
    }
  ) {
    // Check if license number already exists
    const existingLicense = await prisma.drivingLicense.findUnique({
      where: { licenseNo: licenseData.licenseNo },
    });

    if (existingLicense) {
      throw new Error("Driving license number already exists");
    }

    // Create the driving license
    const license = await prisma.drivingLicense.create({
      data: {
        licenseNo: licenseData.licenseNo,
        category: licenseData.category,
        issueDate: licenseData.issueDate || new Date(),
        expiryDate: licenseData.expiryDate || new Date(),
        issuingAuthority: licenseData.issuingAuthority,
        citizen: {
          connect: { id: userId },
        },
      },
    });

    // Create CitizenGem record if it doesn't exist
    // Citizens get 10 gems when they add their driving license
    const existingGem = await prisma.citizenGem.findUnique({
      where: { citizenId: userId },
    });

    if (!existingGem) {
      await prisma.citizenGem.create({
        data: {
          citizenId: userId,
          amount: 10, // Citizens start with 10 gems when they add driving license
        },
      });
      console.log(`✅ Created CitizenGem (10 gems) for user ${userId}`);
    }

    return license;
  }

  /**
   * Get user statistics for dashboard
   */
  static async getUserStatistics(userId: string) {
    const [
      totalVehicles,
      activeAssignments,
      totalViolations,
      citizenGems,
      activeLicenses,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { ownerId: userId, isActive: true },
      }),
      prisma.vehicleAssignment.count({
        where: {
          driverId: userId,
          status: "ACTIVE",
        },
      }),
      prisma.violation.count({
        where: {
          vehicle: {
            OR: [{ ownerId: userId }, { driverId: userId }],
          },
        },
      }),
      prisma.citizenGem.findUnique({
        where: { citizenId: userId },
      }),
      prisma.drivingLicense.count({
        where: {
          citizenId: userId,
          isActive: true,
          expiryDate: { gt: new Date() },
        },
      }),
    ]);

    return {
      totalVehicles,
      activeAssignments,
      totalViolations,
      gems: citizenGems?.amount || 0,
      isRestricted: citizenGems?.isRestricted || false,
      activeLicenses,
    };
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(userId: string, imageUrl: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl },
      select: {
        id: true,
        profileImage: true,
      },
    });
  }

  /**
   * Get users by role with complete profile (for admin)
   */
  static async getUsersByRole(
    role: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: role as any,
          isDeleted: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          designation: true,
          badgeNo: true,
          rank: true,
          joiningDate: true,
          isEmailVerified: true,
          isBlocked: true,
          createdAt: true,
          station: {
            select: {
              name: true,
              code: true,
            },
          },
          citizenGem: {
            select: {
              amount: true,
              isRestricted: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({
        where: {
          role: role as any,
          isDeleted: false,
        },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Validate user profile completeness
   */
  static validateProfileCompleteness(user: any): {
    isComplete: boolean;
    missingFields: string[];
    completionPercentage: number;
  } {
    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "email",
      "presentAddress",
      "presentCity",
      "presentDistrict",
    ];

    const roleSpecificFields: { [key: string]: string[] } = {
      POLICE: ["badgeNo", "joiningDate", "rank", "designation"],
      FIRE_SERVICE: ["badgeNo", "joiningDate", "designation"],
      CITIZEN: ["dateOfBirth"],
    };

    const allRequiredFields = [
      ...requiredFields,
      ...(roleSpecificFields[user.role] || []),
    ];

    const missingFields = allRequiredFields.filter((field) => !user[field]);
    const completionPercentage = Math.round(
      ((allRequiredFields.length - missingFields.length) /
        allRequiredFields.length) *
        100
    );

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage,
    };
  }
}
