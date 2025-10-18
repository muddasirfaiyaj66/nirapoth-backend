import { Queue, Worker, JobsOptions } from "bullmq";
import createRedisClient from "../config/redis";
import { EmailService } from "../services/email.service";

export type EmailJobData = {
  type: "verification";
  payload: {
    email: string;
    firstName: string;
    lastName: string;
    token: string;
  };
};

const connection = createRedisClient();

export const emailQueue = connection
  ? new Queue<EmailJobData>("email-queue", { connection })
  : null;

// Ensure scheduler to handle delayed/retried jobs
// QueueScheduler is not required in BullMQ v5+

// Worker to process emails
export const startEmailWorker = (): void => {
  if (!connection) {
    console.warn("Email worker not started - no Redis connection");
    return;
  }

  // eslint-disable-next-line no-new
  new Worker<EmailJobData>(
    "email-queue",
    async (job) => {
      const emailService = new EmailService();
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
          throw new Error(`Unknown email job type: ${(job.data as any).type}`);
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );
};

export const enqueueVerificationEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  token: string
): Promise<boolean> => {
  if (!emailQueue) return false;
  const opts: JobsOptions = {
    attempts: 5,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: 50,
  };
  await emailQueue.add(
    "verification",
    { type: "verification", payload: { email, firstName, lastName, token } },
    opts
  );
  return true;
};
