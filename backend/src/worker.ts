import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import Redis from "ioredis";
import nodemailer from "nodemailer";
import { DataSource } from "typeorm";
import { EmailJob } from "./models/EmailJob";

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  entities: [EmailJob],
  synchronize: false
});

AppDataSource.initialize();

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null
});

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASS
  }
});

new Worker(
  "email-queue",
  async job => {
    const repo = AppDataSource.getRepository(EmailJob);
    const emailJob = await repo.findOneBy({ id: job.data.jobId });
    if (!emailJob) return;

    try {
      await transporter.sendMail({
        from: `"ReachInbox" <${process.env.ETHEREAL_USER}>`,
        to: emailJob.email,
        subject: emailJob.subject,
        text: emailJob.body || "Hello from ReachInbox"
      });

      emailJob.status = "sent";
      emailJob.sentAt = new Date();
      await repo.save(emailJob);

      console.log("✅ Sent email to", emailJob.email);
    } catch (err) {
      emailJob.status = "failed";
      await repo.save(emailJob);
      console.error("❌ Failed email to", emailJob.email);
    }
  },
  {
    connection: redis,
    concurrency: Number(process.env.CONCURRENCY || 5)
  }
);
