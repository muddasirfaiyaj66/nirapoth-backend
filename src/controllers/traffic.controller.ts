declare((strict_types = 1));

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const nearbyTrafficSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(50).default(10), // km
});

const calculateRouteSchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
});

export class TrafficController {
  /**
   * Get nearby traffic jams within radius
   * Public endpoint - no auth required
   */
  static async getNearbyTraffic(req: Request, res: Response): Promise<void> {
    try {
      const validation = nearbyTrafficSchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid parameters",
          errors: validation.error.errors,
        });
        return;
      }

      const { latitude, longitude, radius } = validation.data;

      // Calculate bounding box for efficient query
      const latDelta = radius / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

      // Query traffic violations from last 2 hours that indicate jams
      const recentViolations = await prisma.violation.findMany({
        where: {
          location: {
            latitude: {
              gte: latitude - latDelta,
              lte: latitude + latDelta,
            },
            longitude: {
              gte: longitude - lngDelta,
              lte: longitude + lngDelta,
            },
          },
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
          },
        },
        include: {
          location: true,
        },
        take: 100,
      });

      // Analyze density to detect traffic jams
      const trafficJams = analyzeTrafficDensity(
        recentViolations,
        latitude,
        longitude
      );

      res.json({
        success: true,
        data: {
          trafficJams,
          radius,
          center: { latitude, longitude },
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching nearby traffic:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch traffic data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get accident hotspots based on historical data
   * Public endpoint - no auth required
   */
  static async getAccidentHotspots(req: Request, res: Response): Promise<void> {
    try {
      const validation = nearbyTrafficSchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid parameters",
          errors: validation.error.errors,
        });
        return;
      }

      const { latitude, longitude, radius } = validation.data;

      // Calculate bounding box
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

      // Query violations from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const violations = await prisma.violation.findMany({
        where: {
          location: {
            latitude: {
              gte: latitude - latDelta,
              lte: latitude + latDelta,
            },
            longitude: {
              gte: longitude - lngDelta,
              lte: longitude + lngDelta,
            },
          },
          createdAt: {
            gte: sixMonthsAgo,
          },
          rule: {
            violationType: {
              in: [
                "OVER_SPEEDING",
                "WRONG_SIDE_DRIVING",
                "SIGNAL_BREAKING",
                "DRUNK_DRIVING",
              ],
            },
          },
        },
        include: {
          location: true,
          rule: true,
        },
      });

      // Group by location clusters to identify hotspots
      const hotspots = identifyAccidentHotspots(
        violations,
        latitude,
        longitude
      );

      res.json({
        success: true,
        data: {
          hotspots,
          radius,
          timeRange: "Last 6 months",
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching accident hotspots:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch accident hotspots",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Calculate optimal routes with traffic and safety considerations
   * Public endpoint - no auth required
   */
  static async calculateSafeRoute(req: Request, res: Response): Promise<void> {
    try {
      const validation = calculateRouteSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid route parameters",
          errors: validation.error.errors,
        });
        return;
      }

      const { originLat, originLng, destLat, destLng } = validation.data;

      // In production, integrate with Google Maps Directions API
      // For now, return mock route options with safety analysis

      const routeOptions = await analyzeRouteOptions(
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng }
      );

      res.json({
        success: true,
        data: {
          routes: routeOptions,
          origin: { latitude: originLat, longitude: originLng },
          destination: { latitude: destLat, longitude: destLng },
          calculatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error calculating route:", error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate route",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Report traffic jam (requires authentication for logged-in users)
   * Public can also report but with limited features
   */
  static async reportTraffic(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, roadName, severity, description } = req.body;

      // Optional user ID if authenticated
      const userId = (req as any).user?.id;

      // Create traffic report in database
      // You might want to create a TrafficReport model

      // For now, log it (implement proper model later)
      console.log("Traffic report received:", {
        latitude,
        longitude,
        roadName,
        severity,
        description,
        userId: userId || "anonymous",
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "Traffic report submitted successfully",
        data: {
          reportId: `traffic-${Date.now()}`,
          status: "PENDING_VERIFICATION",
        },
      });
    } catch (error) {
      console.error("Error reporting traffic:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit traffic report",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

// Helper function to analyze traffic density
function analyzeTrafficDensity(
  violations: any[],
  centerLat: number,
  centerLng: number
): any[] {
  // Group violations by road/location
  const locationGroups: Record<string, any[]> = {};

  violations.forEach((v) => {
    if (v.location) {
      const key = `${v.location.latitude.toFixed(
        3
      )},${v.location.longitude.toFixed(3)}`;
      if (!locationGroups[key]) {
        locationGroups[key] = [];
      }
      locationGroups[key].push(v);
    }
  });

  // Identify high-density areas as traffic jams
  const jams: any[] = [];

  Object.entries(locationGroups).forEach(([key, group]) => {
    if (group.length >= 5) {
      // At least 5 violations indicate congestion
      const [lat, lng] = key.split(",").map(Number);
      const distance = calculateDistance(centerLat, centerLng, lat, lng);

      jams.push({
        id: `jam-${key}`,
        location: { lat, lng },
        roadName: group[0].location?.address || "Unknown Road",
        severity:
          group.length >= 20
            ? "CRITICAL"
            : group.length >= 10
            ? "HIGH"
            : "MEDIUM",
        delayMinutes: Math.min(group.length * 2, 60), // Estimate
        distance,
        affectedLength: 0.5 + group.length * 0.1, // Estimate in km
        violationCount: group.length,
        lastUpdated: new Date().toISOString(),
      });
    }
  });

  return jams.sort((a, b) => a.distance - b.distance);
}

// Helper function to identify accident hotspots
function identifyAccidentHotspots(
  violations: any[],
  centerLat: number,
  centerLng: number
): any[] {
  // Group by location clusters (within 0.5km)
  const clusters: Record<string, any[]> = {};

  violations.forEach((v) => {
    if (v.location) {
      const clusterKey = `${Math.floor(v.location.latitude * 20) / 20},${
        Math.floor(v.location.longitude * 20) / 20
      }`;
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = [];
      }
      clusters[clusterKey].push(v);
    }
  });

  // Identify high-accident clusters
  const hotspots: any[] = [];

  Object.entries(clusters).forEach(([key, group]) => {
    if (group.length >= 10) {
      // At least 10 violations indicate hotspot
      const avgLat =
        group.reduce((sum, v) => sum + v.location.latitude, 0) / group.length;
      const avgLng =
        group.reduce((sum, v) => sum + v.location.longitude, 0) / group.length;
      const distance = calculateDistance(centerLat, centerLng, avgLat, avgLng);

      // Analyze common violation types
      const typeCounts: Record<string, number> = {};
      group.forEach((v) => {
        const type = v.rule?.violationType || "UNKNOWN";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const commonCauses = Object.entries(typeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => formatViolationType(type));

      hotspots.push({
        id: `hotspot-${key}`,
        location: { lat: avgLat, lng: avgLng },
        roadName: group[0].location?.address || "Unknown Road",
        accidentCount: group.length,
        severityLevel:
          group.length >= 30
            ? "CRITICAL"
            : group.length >= 20
            ? "HIGH"
            : "MEDIUM",
        distance,
        timeRange: "Last 6 months",
        commonCauses,
      });
    }
  });

  return hotspots
    .sort((a, b) => b.accidentCount - a.accidentCount)
    .slice(0, 20);
}

// Helper function to calculate distance (Haversine)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format violation type for display
function formatViolationType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Analyze route options (mock - integrate with real routing API)
async function analyzeRouteOptions(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<any[]> {
  // In production, call Google Maps Directions API with alternatives
  // Then analyze each route for traffic and accidents

  const directDistance = calculateDistance(
    origin.lat,
    origin.lng,
    dest.lat,
    dest.lng
  );

  return [
    {
      id: "route-1",
      name: "Fastest Route",
      distance: directDistance,
      duration: Math.round(directDistance * 3), // Rough estimate
      hasTraffic: false,
      hasAccidentHistory: false,
      safetyScore: 95,
      warnings: [],
    },
    {
      id: "route-2",
      name: "Alternative Route",
      distance: directDistance * 1.15,
      duration: Math.round(directDistance * 3.5),
      hasTraffic: true,
      hasAccidentHistory: false,
      safetyScore: 75,
      warnings: ["Moderate traffic expected"],
    },
  ];
}
