<div align="center">

# 🎓 IELTS Scholar

**An AI-Powered Academic IELTS Practice Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Anthropic Claude](https://img.shields.io/badge/AI-Claude_3.5-D97757?style=for-the-badge&logo=anthropic)](https://www.anthropic.com/)

[Overview](#-overview) • [Architecture](#-architecture) • [Developer Setup](#-developer-setup) • [Confidentiality](#-confidentiality-notice)

</div>

---

## 🚀 Overview

IELTS Scholar is our proprietary, production-grade, full-stack platform designed to help students master the Academic IELTS exam. By leveraging advanced AI models (Anthropic Claude & Google GenAI), it provides instant, granular feedback on Writing and Speaking tasks, alongside comprehensive Reading and Listening practice modules.

---

## ✨ Core Capabilities

<details>
<summary><b>📝 Writing & Speaking AI Evaluation</b></summary>

- **Instant Band Scores:** Granular scoring across Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range.
- **Audio Transcription:** Seamless audio upload for Speaking tests powered by OpenAI Whisper.
- **Claude-First Pipeline:** High-quality evaluations with OpenAI fallback for ultimate reliability.

</details>

<details>
<summary><b>📚 Comprehensive Practice Modules</b></summary>

- Full mock tests simulating the real exam environment.
- Daily practice sets with free and premium tier gating.
- Detailed progress tracking and band score projection.

</details>

<details>
<summary><b>🎨 "Academic Editorial" Design System</b></summary>

- Modern Next.js 16 App Router frontend.
- Bento-grid layouts, ambient shadows, and a warm cream + terracotta color palette.
- Highly responsive and accessible components.

</details>

<details>
<summary><b>⚙️ Robust & Scalable Backend</b></summary>

- Node.js/Express REST API with robust security (Helmet, XSS Clean, Rate Limiting).
- Asynchronous task processing with BullMQ & Redis for heavy AI operations.
- AWS S3 integration for secure audio storage via pre-signed URLs.
- Razorpay payment gateway integration for seamless subscriptions.

</details>

---

## 🏗️ Architecture

IELTS Scholar is built as a decoupled monorepo:

```text
IELTS_Platform/
├── client/                # Next.js 16 Frontend (App Router, Tailwind v4, Redux Toolkit)
└── backend/               # Node.js/Express API (MongoDB, Redis, BullMQ, AI SDKs)
```

For detailed sub-system documentation, please refer to the internal engineering docs:
- 📖 [Frontend Documentation](./client/README.md)
- 📖 [Backend Documentation](./backend/README.md)

---

## 🛠️ Developer Setup

Follow these steps to set up the project locally for internal development.

### 1. Prerequisites
- Node.js (v18 or higher)
- Docker & Docker Compose (for easy backend services setup)
- Internal Development API Keys (Request from Engineering Lead)
- Redis instance

### 2. Clone the Repository
*Ensure you are authenticated with the company GitHub organization.*
```bash
git clone https://github.com/Talha-Faizan/IELTS_PLATFORM.git
cd IELTS_Platform
```

### 3. Setup the Backend
Navigate to the backend directory and set up your environment:
```bash
cd backend
cp .env.example .env
# Fill in your .env variables (MongoDB URI, AI Keys, Redis URL, etc.)

# Using Docker (Recommended for services)
docker-compose up -d

# Or run locally
npm install
npm run dev
```
*Note: In a separate terminal, start the background worker for AI evaluations:*
```bash
npm run worker
```

### 4. Setup the Frontend
Open a new terminal and navigate to the client directory:
```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security & Performance

- **Rate Limiting:** Per-route protections to prevent abuse.
- **Data Sanitization:** Guarding against NoSQL injections and XSS attacks.
- **Async Queues:** BullMQ ensures UI remains responsive while AI models evaluate submissions in the background.

---

## 🛑 Confidentiality Notice

**PROPRIETARY AND CONFIDENTIAL**

This repository and its contents are the intellectual property of the company. It is intended for internal use and authorized contractors only. Do not distribute, copy, or share any part of this codebase outside of the organization without explicit written permission. All code, design patterns, and AI prompt engineering details must remain confidential.

---

<div align="center">
  <p>Internal Engineering &bull; IELTS Scholar Team</p>
</div>
