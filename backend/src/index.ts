import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
console.log("GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID);
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./auth/google";
import { DataSource } from "typeorm";
import { Queue } from "bullmq";
import Redis from "ioredis";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import { EmailJob } from "./models/EmailJob";
import { requireAuth } from "./middleware/auth";


const upload = multer({ dest: "uploads/" });

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(session({ secret: "reachinbox", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  entities: [EmailJob],
  synchronize: true
});

//redis;
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null
});

export const emailQueue = new Queue("email-queue", { connection: redis });
//GOOGLE AUTH ROUTES
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/"
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/dashboard");
  }
);
//AUTH APIs
app.get("/api/me", (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json(req.user);
});

app.post("/api/logout", (req, res) => {
  req.logout(() => {
    res.sendStatus(200);
  });
});

app.post("/api/schedule/csv", requireAuth, upload.single("file"), async (req:any, res) => {
  const repo = AppDataSource.getRepository(EmailJob);
  const { subject, body, startTime, delaySeconds, hourlyLimit } = req.body;

  const emails:string[] = [];
  fs.createReadStream(req.file.path)
    .pipe(parse({ columns: false }))
    .on("data", row => emails.push(row[0]))
    .on("end", async () => {
      let currentTime = new Date(startTime).getTime();
      let sequence = 0;

      for (const email of emails) {
        const job = repo.create({
          email,
          subject,
          body,
          sender: req.user.email,
          sendAt: new Date(currentTime),
          sequence: sequence++
        });
        await repo.save(job);

        await emailQueue.add("send", { jobId: job.id, sender: job.sender }, {
          delay: currentTime - Date.now()
        });

        currentTime += delaySeconds * 1000;
      }
      res.json({ scheduled: emails.length });
    });
});
//FETCH SCHEDULED EMAILS
app.get("/api/scheduled", requireAuth, async (req: any, res) => {
  const repo = AppDataSource.getRepository(EmailJob);

  const scheduled = await repo.find({
    where: {
      sender: req.user.email,
      status: "scheduled"
    },
    order: {
      sendAt: "ASC"
    }
  });

  res.json(scheduled);
});

//FETCH SENT EMAILS
app.get("/api/sent", requireAuth, async (req: any, res) => {
  const repo = AppDataSource.getRepository(EmailJob);

  const sent = await repo.find({
    where: {
      sender: req.user.email,
      status: "sent"
    },
    order: {
      sentAt: "DESC"
    }
  });

  res.json(sent);
});

const PORT = process.env.PORT || 4001;

if (process.env.RUN_MODE !== "worker") {
  AppDataSource.initialize().then(() => {
    app.listen(4001, () => {
      console.log("API running on http://localhost:4001");
    });
  });
}


