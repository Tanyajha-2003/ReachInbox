# 📬 ReachInbox — Email Campaign Scheduler

ReachInbox is a **production-grade full-stack email campaign scheduling platform** that allows users to authenticate via Google, upload recipient lists, schedule emails with delays, and track campaign status — all with **persistence, concurrency control, and background processing**.

---

## ✨ Features

### 🔐 Authentication
- Google OAuth 2.0
- Protected backend APIs using authentication middleware

---

### 📧 Email Campaign Scheduling
- Upload **CSV / TXT** files containing recipient email addresses
- Configure campaigns with:
  - Start time
  - Delay between emails
  - Hourly sending limit
- Emails are processed in the background using a job queue

---

### 📊 Dashboard
- View **Scheduled Emails**
- View **Sent Emails**
- Auto-refresh for sent email updates
- Displays logged-in user profile (name, email, avatar)
- Clean, responsive UI with Tailwind CSS

---

### ⚙️ Reliability & Scalability
- Redis + BullMQ for background job processing
- PostgreSQL persistence (jobs survive server restarts)
- Configurable worker concurrency
- Failure handling with status tracking

---

## 🧱 Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Passport.js (Google OAuth 2.0)
- PostgreSQL
- Redis
- BullMQ
- Ethereal SMTP

### Frontend
- React + TypeScript
- Axios
- Tailwind CSS

---

## 🏗 Architecture Overview

### 🔐 Authentication Flow
1. User logs in using Google OAuth
2. Passport.js handles authentication
3. User session stored in secure cookies
4. Backend APIs protected via auth middleware  
> No separate users table required

---

### 📧 Email Scheduling Flow
1. User uploads a CSV/TXT file from the dashboard
2. Backend parses email addresses
3. Each email is stored in PostgreSQL
4. BullMQ schedules jobs with:
   - Delays
   - Hourly rate limits
5. Worker processes jobs and sends emails via SMTP
6. Status updates reflected on the dashboard

---

### 💾 Persistence on Restart
- All scheduled emails are stored in **PostgreSQL**
- Redis manages delayed execution only
- On server restart:
  - Scheduled jobs remain in the database
  - BullMQ automatically resumes pending jobs

---

### 🚦 Rate Limiting & Concurrency
- Delay between emails controls send rate
- Worker concurrency limits parallel processing
- Prevents SMTP overload
- Ensures stable and reliable throughput

---

## 🧪 Email Sending (Ethereal)

This project uses **Ethereal Email** for testing purposes.

- Emails do **not** go to real inboxes
- Each email generates a preview URL
- Safe for development and demos

Create an account at:  
👉 https://ethereal.email


## 🔧 Environment Variables

### Backend `.env`

```env
PORT=4001

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

RUN_MODE=api

# Database
DB_URL=postgresql://user:password@localhost:5432/reachinbox

# Redis
REDIS_URL=redis://localhost:6379

# Ethereal

ETHEREAL_USER=your_ethereal_user
ETHEREAL_PASS=your_ethereal_password

MAX_EMAILS_PER_HOUR=100
CONCURRENCY=5

## 🚀 How to Run the Project

### 2️⃣ Clone the Repository

```bash
git clone 'url'
cd reachinbox
cd backend
npm install
npm run dev

```Start BullMQ Worker
npm run worker

```frontend
cd frontend
npm install
npm run dev

```redis
redis-server
