import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./auth/google";
import { DataSource } from "typeorm";
import { Queue } from "bullmq";
import Redis from "ioredis";
import connectRedis from "connect-redis";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import { EmailJob } from "./models/EmailJob";
import { requireAuth } from "./middleware/auth";

// -------------------- CONFIG --------------------
const PORT = process.env.PORT || 4001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// -------------------- APP --------------------
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// -------------------- REDIS --------------------
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// -------------------- SESSION (PRODUCTION SAFE) --------------------
const RedisStore = connectRedis(session);

app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,       
      sameSite: "none", 
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------- DATABASE --------------------
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }, 
  entities: [EmailJob],
  synchronize: true,
});

// -------------------- QUEUE --------------------
export const emailQueue = new Queue("email-queue", {
  connection: redis,
});

// -------------------- AUTH ROUTES --------------------
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: FRONTEND_URL + "/",
  }),
  (req, res) => {
    res.redirect(FRONTEND_URL + "/dashboard");
  }
);

// -------------------- AUTH APIs --------------------
app.get("/api/me", (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json(req.user);
});

app.post("/api/logout", (req, res) => {
  req.logout(() => res.sendStatus(200));
});

// -------------------- SCHEDULE EMAILS --------------------
app.post(
  "/api/schedule/csv",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    const { subject, body, startTime, delaySeconds } = req.body;

    if (!subject || !startTime || delaySeconds <= 0) {
      return res.status(400).json({ error: "Invalid scheduling parameters" });
    }

    const startTimestamp = Date.parse(startTime);
    if (isNaN(startTimestamp)) {
      return res.status(400).json({ error: "Invalid start time" });
    }

    const repo = AppDataSource.getRepository(EmailJob);
    const emails: string[] = [];

    fs.createReadStream(req.file.path)
      .pipe(parse({ columns: false }))
      .on("data", row => {
        if (row[0]) emails.push(row[0]);
      })
      .on("end", async () => {
        let currentTime = startTimestamp;
        let sequence = 0;

        for (const email of emails) {
          const job = repo.create({
            email,
            subject,
            body,
            sender: req.user.email,
            sendAt: new Date(currentTime),
            sequence: sequence++,
          });

          await repo.save(job);

          await emailQueue.add(
            "send",
            { jobId: job.id, sender: job.sender },
            { delay: currentTime - Date.now() }
          );

          currentTime += delaySeconds * 1000;
        }
        fs.unlinkSync(req.file.path);

        res.json({ scheduled: emails.length });
      });
  }
);

// -------------------- FETCH SCHEDULED --------------------
app.get("/api/scheduled", requireAuth, async (req: any, res) => {
  const repo = AppDataSource.getRepository(EmailJob);
  const scheduled = await repo.find({
    where: { sender: req.user.email, status: "scheduled" },
    order: { sendAt: "ASC" },
  });
  res.json(scheduled);
});

// -------------------- FETCH SENT --------------------
app.get("/api/sent", requireAuth, async (req: any, res) => {
  const repo = AppDataSource.getRepository(EmailJob);
  const sent = await repo.find({
    where: { sender: req.user.email, status: "sent" },
    order: { sentAt: "DESC" },
  });
  res.json(sent);
});

// -------------------- START SERVER --------------------
if (process.env.RUN_MODE !== "worker") {
  AppDataSource.initialize()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error("Error initializing database:", err);
    });
}
