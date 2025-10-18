"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.disconnectPrisma = disconnectPrisma;
const client_1 = require("@prisma/client");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
if (process.env.NODE_ENV !== "production") {
    global.prisma = exports.prisma;
}
// Graceful shutdown
async function disconnectPrisma() {
    await exports.prisma.$disconnect();
}
