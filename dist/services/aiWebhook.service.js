import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class AIWebhookService {
    /**
     * Handle Fire Detection from AI
     */
    static async handleFireDetection(data) {
        console.log("🔥 AI FIRE DETECTION:", data);
        // Create fire incident
        const incident = await prisma.fireIncident.create({
            data: {
                incidentNumber: `AI-FI-${Date.now()}`,
                type: "BUILDING_FIRE",
                severity: data.severity,
                description: `AI-detected fire with ${data.confidence}% confidence`,
                address: data.location.address || `${data.location.latitude}, ${data.location.longitude}`,
                coordinates: `${data.location.latitude},${data.location.longitude}`,
                images: [data.imageUrl],
                reportedBy: "Nirapoth AI System",
                reporterPhone: "AI-DETECTION",
            },
        });
        // Notify ALL fire service users
        const fireServiceUsers = await prisma.user.findMany({
            where: { role: "FIRE_SERVICE" },
            select: { id: true },
        });
        if (fireServiceUsers.length > 0) {
            await prisma.notification.createMany({
                data: fireServiceUsers.map(user => ({
                    userId: user.id,
                    type: "FIRE_INCIDENT_REPORTED",
                    title: "🚨 AI DETECTED FIRE EMERGENCY!",
                    message: `Fire detected by AI at ${data.location.address || "detected location"}. Confidence: ${data.confidence}%. Immediate response required!`,
                    priority: "URGENT",
                })),
            });
        }
        return incident;
    }
    /**
     * Handle Accident Detection from AI
     */
    static async handleAccidentDetection(data) {
        console.log("🚗 AI ACCIDENT DETECTION:", data);
        // Find police users
        const policeUsers = await prisma.user.findMany({
            where: { role: "POLICE" },
            select: { id: true, firstName: true, lastName: true },
        });
        // Notify police
        if (policeUsers.length > 0) {
            await prisma.notification.createMany({
                data: policeUsers.map(user => ({
                    userId: user.id,
                    type: "SYSTEM",
                    title: "🚨 AI DETECTED ACCIDENT!",
                    message: `Accident detected at ${data.location.address}. Severity: ${data.severity}. ${data.vehiclesInvolved || 'Multiple'} vehicles involved. Immediate assistance required!`,
                    priority: "URGENT",
                })),
            });
        }
        return {
            id: `AI-ACC-${Date.now()}`,
            type: "ACCIDENT",
            severity: data.severity,
            location: data.location,
            imageUrl: data.imageUrl,
            confidence: data.confidence,
            notifiedOfficers: policeUsers.length,
            timestamp: new Date(),
        };
    }
    /**
     * Handle Violation Detection from AI
     */
    static async handleViolationDetection(data) {
        console.log("⚠️ AI VIOLATION DETECTION:", data);
        // Find vehicle by number plate
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                registrationNo: {
                    equals: data.numberPlate,
                    mode: "insensitive",
                },
            },
        });
        if (!vehicle) {
            console.log("❌ Vehicle not found for plate:", data.numberPlate);
            return {
                success: false,
                message: "Vehicle not found in database",
                numberPlate: data.numberPlate,
            };
        }
        // Determine fine amount
        let fineAmount = 0;
        let ruleName = "";
        let description = "";
        switch (data.violationType) {
            case "SPEEDING":
                const overspeed = (data.speed || 0) - (data.speedLimit || 60);
                if (overspeed > 40) {
                    fineAmount = 5000;
                    ruleName = "Excessive Speeding";
                }
                else if (overspeed > 20) {
                    fineAmount = 3000;
                    ruleName = "High Speeding";
                }
                else {
                    fineAmount = 1500;
                    ruleName = "Overspeeding";
                }
                description = `Speed: ${data.speed} km/h in ${data.speedLimit} km/h zone`;
                break;
            case "RED_LIGHT":
                fineAmount = 2000;
                ruleName = "Red Light Violation";
                description = "Crossed red traffic signal";
                break;
            case "WRONG_WAY":
                fineAmount = 3000;
                ruleName = "Wrong Way Driving";
                description = "Driving in wrong direction";
                break;
            case "NO_HELMET":
                fineAmount = 500;
                ruleName = "Helmet Violation";
                description = "Motorcyclist without helmet";
                break;
            case "RECKLESS_DRIVING":
                fineAmount = 4000;
                ruleName = "Reckless Driving";
                description = "Dangerous driving detected";
                break;
        }
        // Find rule
        let rule = await prisma.rule.findFirst({
            where: { title: { contains: ruleName, mode: "insensitive" } },
        });
        if (!rule) {
            rule = await prisma.rule.create({
                data: {
                    code: `AI-${data.violationType}-${Date.now()}`,
                    title: ruleName,
                    description: description,
                },
            });
        }
        // Create violation
        const violation = await prisma.violation.create({
            data: {
                ruleId: rule.id,
                vehicleId: vehicle.id,
                status: "CONFIRMED",
                description: description,
                evidenceUrl: data.imageUrl,
            },
        });
        // Create fine
        const fine = await prisma.fine.create({
            data: {
                violationId: violation.id,
                amount: fineAmount,
                status: "UNPAID",
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        // Notify vehicle owner
        await prisma.notification.create({
            data: {
                userId: vehicle.ownerId,
                type: "PENALTY_APPLIED",
                title: "⚠️ Traffic Violation Detected",
                message: `Your vehicle (${data.numberPlate}) violated ${ruleName}. Fine: ৳${fineAmount}. Location: ${data.location.address}`,
                priority: "HIGH",
            },
        });
        // Get owner details
        const owner = await prisma.user.findUnique({
            where: { id: vehicle.ownerId },
            select: { id: true, firstName: true, lastName: true, email: true },
        });
        return {
            success: true,
            violation,
            fine,
            vehicle,
            owner,
        };
    }
}
