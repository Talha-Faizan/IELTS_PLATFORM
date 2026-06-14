# IELTS Scholar — Backend API

Production-grade Node.js/Express REST API for the Academic IELTS Practice Platform.

## Architecture

```
src/
├── config/
│   ├── database.js        # MongoDB with retry logic
│   ├── logger.js          # Winston structured logging
│   ├── redis.js           # IORedis for BullMQ
│   └── s3.js              # AWS S3 / Cloudflare R2 client
│
├── middleware/
│   ├── auth.js            # JWT auth + role guards
│   ├── errorHandler.js    # AppError + global error handler + asyncHandler
│   ├── rateLimiter.js     # Per-route rate limits + slow-down
│   └── upload.js          # Multer audio upload (in-memory → S3)
│
├── models/
│   ├── User.js            # Auth, usage limits, subscription state
│   ├── Question.js        # Reading/Listening/Writing/Speaking content
│   ├── MockTest.js        # Full test structure
│   ├── Submission.js      # Answers + AI feedback results
│   ├── Subscription.js    # Razorpay subscription records
│   └── ExpertReview.js    # Human review queue
│
├── routes/
│   ├── auth.js            # Register, verify, login, refresh, reset
│   ├── user.js            # Profile, progress, submissions
│   ├── content.js         # Practice sets, mock tests, audio pre-signed URLs
│   ├── submission.js      # Submit answers, audio upload, expert review
│   ├── subscription.js    # Razorpay orders, webhook handler
│   └── admin.js           # User/content management, metrics
│
├── services/
│   ├── aiService.js       # Claude (Anthropic) → OpenAI fallback feedback
│   ├── storageService.js  # S3/R2 upload, pre-signed URLs, delete
│   ├── queueService.js    # BullMQ queue client (enqueue jobs)
│   └── email.js           # Nodemailer transactional emails
│
└── workers/
    └── feedbackWorker.js  # BullMQ worker: transcription + AI feedback
```

## Quick Start

### Local (bare metal)
```bash
cp .env.example .env        # Fill in secrets
npm install
npm run dev                 # API server
npm run worker              # Feedback worker (separate terminal)
```

### Docker
```bash
cp .env.example .env
docker-compose up --build
```

## Key Design Decisions

### AI Pipeline (Claude-first)
- **Primary**: Anthropic Claude Sonnet via `@anthropic-ai/sdk`
- **Fallback**: OpenAI GPT-4o if Claude fails
- **Transcription**: OpenAI Whisper API for Speaking audio
- **Mock mode**: Set `ENABLE_MOCK_AI=true` for local dev without API keys

### Async Feedback (BullMQ)
- Writing/Speaking submissions return **immediately** (`feedbackStatus: "pending"`)
- Worker process picks up jobs, calls AI, updates submission
- Premium jobs get **priority 1**, free users **priority 2**
- 3 retries with exponential backoff; final failure marks `feedbackStatus: "failed"`
- Worker scales independently — add more replicas as queue depth grows

### Security
- `helmet` security headers
- `express-mongo-sanitize` — prevent NoSQL injection
- `xss-clean` — sanitize HTML in request body
- `hpp` — prevent HTTP parameter pollution
- Per-route rate limiting (general: 100/15min, auth: 10/15min)
- Progressive slow-down above 70% rate limit threshold
- Webhook raw body preserved for Razorpay HMAC verification
- Audio pre-signed URLs expire in 1 hour; objects use AES256 SSE

### Free vs Premium Gating
Enforced server-side in `User.canAccess(section)`:
| Section  | Free Limit   |
|----------|-------------|
| Reading  | 10/day      |
| Listening| 2/day       |
| Writing  | 2/day       |
| Speaking | 1/day       |
| Mock Test| 1 lifetime  |

## API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register (sends verification email) |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/login` | Login → access + refresh tokens |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/forgot-password` | Send reset link |
| POST | `/api/auth/reset-password` | Reset with token |

### Submissions
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/submissions` | Submit Reading/Listening answers or Writing text |
| POST | `/api/submissions/audio` | Upload speaking audio files (multipart) |
| GET | `/api/submissions/:id` | Get submission + feedback |
| PUT | `/api/submissions/:id/draft` | Autosave writing draft |
| POST | `/api/submissions/:id/expert-review` | Request human review (premium) |
| POST | `/api/submissions/feedback-rating` | Thumbs up/down on AI feedback |

### AI Feedback Response Schema (Writing)
```json
{
  "taskAchievement":   { "bandScore": 6.5, "commentary": "...", "suggestions": ["..."] },
  "coherenceCohesion": { "bandScore": 6.0, "commentary": "...", "suggestions": ["..."] },
  "lexicalResource":   { "bandScore": 7.0, "commentary": "...", "suggestions": ["..."] },
  "grammaticalRange":  { "bandScore": 7.0, "commentary": "...", "suggestions": ["..."] },
  "overallBand": 6.5,
  "highlightedIssues": [{ "text": "...", "issue": "...", "type": "error|warning|strength" }],
  "wordCount": 284
}
```

## Production Deployment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Set all secrets in environment (never commit `.env`)
- [ ] Enable MongoDB Atlas / managed Redis (Upstash recommended)
- [ ] Set `ENABLE_MOCK_AI=false`
- [ ] Configure Razorpay live mode keys + webhook URL
- [ ] Set up S3/R2 bucket with public access disabled
- [ ] Deploy API + Worker as separate containers/processes
- [ ] Set up log aggregation (Datadog, Axiom, or CloudWatch)
- [ ] Configure MongoDB indexes (auto-created on first run)
- [ ] Set CORS `FRONTEND_URL` to production domain
