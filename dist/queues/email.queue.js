"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueVerificationEmail = exports.startEmailWorker = exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../config/redis"));
const email_service_1 = require("../services/email.service");
const connection = (0, redis_1.default)();
exports.emailQueue = connection
    ? new bullmq_1.Queue("email-queue", { connection })
    : null;
// Ensure scheduler to handle delayed/retried jobs
// QueueScheduler is not required in BullMQ v5+
// Worker to process emails
const startEmailWorker = () => {
    if (!connection) {
        console.warn("Email worker not started - no Redis connection");
        return;
    }
    // eslint-disable-next-line no-new
    new bullmq_1.Worker("email-queue", async (job) => {
        const emailService = new email_service_1.EmailService();
        switch (job.data.type) {
            case "verification": {
                const { email, firstName, lastName, token } = job.data.payload;
                await emailService.sendVerificationEmail({
                    email,
                    firstName,
                    lastName,
                    verificationToken: token,
                });
                break;
            }
            default:
                throw new Error(`Unknown email job type: ${job.data.type}`);
        }
    }, {
        connection,
        concurrency: 5,
    });
};
exports.startEmailWorker = startEmailWorker;
const enqueueVerificationEmail = async (email, firstName, lastName, token) => {
    if (!exports.emailQueue)
        return false;
    const opts = {
        attempts: 5,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: true,
        removeOnFail: 50,
    };
    await exports.emailQueue.add("verification", { type: "verification", payload: { email, firstName, lastName, token } }, opts);
    return true;
};
exports.enqueueVerificationEmail = enqueueVerificationEmail;
