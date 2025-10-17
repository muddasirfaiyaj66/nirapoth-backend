import { prisma } from "../lib/prisma";
import { LicenseCategory } from "@prisma/client";

export interface CreateDrivingLicenseDTO {
  licenseNo: string;
  citizenId: string;
  category: LicenseCategory;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  restrictions?: string[];
  endorsements?: string[];
}

export interface UpdateDrivingLicenseDTO {
  category?: LicenseCategory;
  expiryDate?: Date;
  restrictions?: string[];
  endorsements?: string[];
  isActive?: boolean;
}

export interface DeductGemsDTO {
  licenseId: string;
  gemsToDeduct: number;
  reason: string;
  deductedBy: string; // Police officer ID
}

class DrivingLicenseService {
  /**
   * Create a new driving license with initial 10 gems
   */
  async createLicense(data: CreateDrivingLicenseDTO) {
    const { restrictions, endorsements, ...rest } = data;

    // Check if citizen already has an active license
    const existingLicense = await prisma.drivingLicense.findFirst({
      where: {
        citizenId: data.citizenId,
        isActive: true,
      },
    });

    if (existingLicense) {
      throw new Error("Citizen already has an active driving license");
    }

    // Check if license number is already in use
    const licenseExists = await prisma.drivingLicense.findUnique({
      where: { licenseNo: data.licenseNo },
    });

    if (licenseExists) {
      throw new Error("License number already exists");
    }

    return await prisma.drivingLicense.create({
      data: {
        ...rest,
        gems: 10, // Initial 10 gems bonus
        restrictions: restrictions ? JSON.stringify(restrictions) : null,
        endorsements: endorsements ? JSON.stringify(endorsements) : null,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            nidNo: true,
            birthCertificateNo: true,
            presentAddress: true,
            presentCity: true,
            presentDistrict: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    });
  }

  /**
   * Get citizen's driving license
   */
  async getLicenseByUserId(citizenId: string) {
    const license = await prisma.drivingLicense.findFirst({
      where: {
        citizenId,
        isActive: true,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            nidNo: true,
            birthCertificateNo: true,
            presentAddress: true,
            presentCity: true,
            presentDistrict: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    });

    if (license) {
      return {
        ...license,
        restrictions: license.restrictions
          ? JSON.parse(license.restrictions)
          : [],
        endorsements: license.endorsements
          ? JSON.parse(license.endorsements)
          : [],
      };
    }

    return null;
  }

  /**
   * Get license by ID
   */
  async getLicenseById(licenseId: string) {
    const license = await prisma.drivingLicense.findUnique({
      where: { id: licenseId },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            nidNo: true,
            birthCertificateNo: true,
            presentAddress: true,
            presentCity: true,
            presentDistrict: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    });

    if (license) {
      return {
        ...license,
        restrictions: license.restrictions
          ? JSON.parse(license.restrictions)
          : [],
        endorsements: license.endorsements
          ? JSON.parse(license.endorsements)
          : [],
      };
    }

    return null;
  }

  /**
   * Get license by license number
   */
  async getLicenseByLicenseNo(licenseNo: string) {
    const license = await prisma.drivingLicense.findUnique({
      where: { licenseNo },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            nidNo: true,
            birthCertificateNo: true,
            presentAddress: true,
            presentCity: true,
            presentDistrict: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    });

    if (license) {
      return {
        ...license,
        restrictions: license.restrictions
          ? JSON.parse(license.restrictions)
          : [],
        endorsements: license.endorsements
          ? JSON.parse(license.endorsements)
          : [],
      };
    }

    return null;
  }

  /**
   * Update license information
   */
  async updateLicense(licenseId: string, data: UpdateDrivingLicenseDTO) {
    const { restrictions, endorsements, ...rest } = data;

    return await prisma.drivingLicense.update({
      where: { id: licenseId },
      data: {
        ...rest,
        restrictions: restrictions ? JSON.stringify(restrictions) : undefined,
        endorsements: endorsements ? JSON.stringify(endorsements) : undefined,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            nidNo: true,
            birthCertificateNo: true,
            presentAddress: true,
            presentCity: true,
            presentDistrict: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    });
  }

  /**
   * Deduct gems from license (Police only)
   * If gems reach 0, blacklist the license
   */
  async deductGems(data: DeductGemsDTO): Promise<{
    license: any;
    blacklisted: boolean;
    remainingGems: number;
  }> {
    const { licenseId, gemsToDeduct, reason, deductedBy } = data;

    if (gemsToDeduct <= 0) {
      throw new Error("Gems to deduct must be positive");
    }

    const license = await prisma.drivingLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      throw new Error("License not found");
    }

    if (license.isBlacklisted) {
      throw new Error(
        "License is already blacklisted. Must pay ৳5000 penalty and reapply."
      );
    }

    const newGems = Math.max(0, license.gems - gemsToDeduct);
    const shouldBlacklist = newGems === 0;

    const updatedLicense = await prisma.drivingLicense.update({
      where: { id: licenseId },
      data: {
        gems: newGems,
        isBlacklisted: shouldBlacklist,
        blacklistedAt: shouldBlacklist ? new Date() : undefined,
        blacklistReason: shouldBlacklist
          ? `All gems depleted. Reason: ${reason}`
          : undefined,
        isActive: !shouldBlacklist, // Deactivate if blacklisted
        violationCount: { increment: 1 },
        lastViolationAt: new Date(),
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            nidNo: true,
            birthCertificateNo: true,
            presentAddress: true,
            presentCity: true,
            presentDistrict: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
    });

    // Log the gem deduction
    console.log(`🔻 Gems deducted from license ${license.licenseNo}:`, {
      previous: license.gems,
      deducted: gemsToDeduct,
      new: newGems,
      blacklisted: shouldBlacklist,
      reason,
      deductedBy,
    });

    return {
      license: {
        ...updatedLicense,
        restrictions: updatedLicense.restrictions
          ? JSON.parse(updatedLicense.restrictions)
          : [],
        endorsements: updatedLicense.endorsements
          ? JSON.parse(updatedLicense.endorsements)
          : [],
      },
      blacklisted: shouldBlacklist,
      remainingGems: newGems,
    };
  }

  /**
   * Pay blacklist penalty and allow reapplication
   */
  async payBlacklistPenalty(licenseId: string): Promise<void> {
    const license = await prisma.drivingLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      throw new Error("License not found");
    }

    if (!license.isBlacklisted) {
      throw new Error("License is not blacklisted");
    }

    await prisma.drivingLicense.update({
      where: { id: licenseId },
      data: {
        blacklistPenaltyPaid: true,
      },
    });

    console.log(
      `💰 Blacklist penalty paid for license ${license.licenseNo} (৳5000)`
    );
  }

  /**
   * Check if license is valid for driving
   */
  async isLicenseValid(licenseId: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    const license = await prisma.drivingLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      return { valid: false, reason: "License not found" };
    }

    if (!license.isActive) {
      return { valid: false, reason: "License is inactive" };
    }

    if (license.isBlacklisted) {
      return {
        valid: false,
        reason:
          "License is blacklisted. Must pay ৳5000 penalty and reapply for driving test",
      };
    }

    if (license.isSuspended) {
      const suspendedUntil = license.suspendedUntil
        ? new Date(license.suspendedUntil)
        : null;
      if (suspendedUntil && suspendedUntil > new Date()) {
        return {
          valid: false,
          reason: `License is suspended until ${suspendedUntil.toLocaleDateString()}`,
        };
      }
    }

    if (license.expiryDate < new Date()) {
      return { valid: false, reason: "License has expired" };
    }

    return { valid: true };
  }

  /**
   * Get all blacklisted licenses
   */
  async getBlacklistedLicenses() {
    return await prisma.drivingLicense.findMany({
      where: {
        isBlacklisted: true,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            nidNo: true,
            birthCertificateNo: true,
            presentAddress: true,
            presentCity: true,
            presentDistrict: true,
            gender: true,
            bloodGroup: true,
          },
        },
      },
      orderBy: {
        blacklistedAt: "desc",
      },
    });
  }
}

export default new DrivingLicenseService();
