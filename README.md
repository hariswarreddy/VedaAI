# VedaAI — AI Assessment Creator

A full-stack app that lets a teacher describe an assessment (topic, due date, mix of question types/marks/difficulty, optional PDF/text source) and generates a **structured, exam-ready question paper** with sections, difficulty badges and per-question marks. Generation runs **async** through a BullMQ queue with **live progress over WebSocket**, and the output page supports **PDF export** and **regeneration**.

---

## Stack

**Frontend** — Next.js 14 (App Router) · TypeScript · TailwindCSS · Zustand · socket.io-client · jsPDF + html2canvas · lucide-react

**Backend** — Node.js · Express · TypeScript · Mongoose · ioredis · BullMQ · Socket.IO · Zod · pdf-parse

**AI** — Groq Chat Completions (`llama-3.1-8b-instant` by default) using JSON-object response format, with a robust Zod-validated parser that reconciles output against the requested config.

---

## Architecture

```
┌───────────────────┐                ┌──────────────────────────┐
│  Next.js (3000)   │                │   Express API (4000)     │
│  - /create form   │  POST /api ──▶ │   - validate (Zod)       │
│  - Zustand store  │                │   - extract PDF/text     │
│  - socket client  │ ◀── ws  ─────  │   - persist → Mongo      │
│  - PDF export     │                │   - enqueue BullMQ job   │
└───────────────────┘                └──────────────┬───────────┘
                                                    │
                                  Socket.IO emit    │ enqueue
                                   ▲                ▼
                                   │       ┌────────────────────┐
                                   └────── │  BullMQ Worker     │
                                           │  - build prompt    │
                                           │  - call Groq LLM   │
                                           │  - cache in Redis  │
                                           │  - Zod parse +     │
                                           │    reconcile       │
                                           │  - save sections   │
                                           └─────────┬──────────┘
                                                     ▼
                                       ┌────────────────────────┐
                                       │ MongoDB · Redis (BullMQ│
                                       │ + LLM response cache)  │
                                       └────────────────────────┘
```

### Flow
1. User submits form → `POST /api/assignments` (multipart).
2. Server validates with Zod, extracts text from optional PDF (`pdf-parse`), saves an `Assignment` in MongoDB with `status: queued`.
3. A BullMQ job is enqueued. The worker:
   - Builds a structured prompt from the config.
   - Calls Groq with `response_format: json_object`.
   - Caches the raw LLM response in Redis (`gen:{assignmentId}`, 1h TTL).
   - **Never renders raw LLM text** — output is parsed and re-shaped by `services/parser.ts` (Zod schema + reconciliation to enforce question counts, marks and types from the user config).
   - Saves `sections[]` to the assignment doc, sets `status: completed`.
4. Throughout, the worker emits `assignment:update` events scoped to `room: assignment:{id}`; the frontend subscribes on the `/generating/{id}` page and the progress bar updates live. There's also a 4s REST safety-poll in case the socket reconnects late.
5. The `/assignment/{id}` page renders a clean printable paper with student info inputs, sections A/B/C, difficulty badges, MCQ options, ruled answer lines, regenerate action and PDF export.

### Why this design
- **Async + queue** keeps the API responsive and isolates LLM latency and retries.
- **WebSocket + REST polling fallback** = robust UX even when sockets get flaky.
- **Validate → reconcile** in the parser means the LLM cannot break the contract: counts/marks/types always match the teacher's config, regardless of model drift.
- **Redis cache** of raw responses keeps regenerations cheap and idempotent.

---

## Project structure

```
vedaai/
├─ backend/
│  ├─ src/
│  │  ├─ index.ts                # API + in-process worker
│  │  ├─ config/env.ts
│  │  ├─ db/{mongo.ts,redis.ts}
│  │  ├─ models/Assignment.ts
│  │  ├─ routes/assignments.ts   # POST/GET/regenerate
│  │  ├─ services/{prompt.ts,groq.ts,parser.ts}
│  │  ├─ queue/{index.ts,worker.ts}
│  │  └─ ws/socket.ts
│  ├─ .env.example
│  └─ package.json
└─ frontend/
   ├─ src/
   │  ├─ app/
   │  │  ├─ page.tsx             # landing
   │  │  ├─ create/page.tsx      # form (Zustand + validation)
   │  │  ├─ generating/[id]/page.tsx  # live progress via ws
   │  │  └─ assignment/[id]/page.tsx  # output paper + PDF/regen
   │  ├─ components/DifficultyBadge.tsx
   │  ├─ lib/{api.ts,socket.ts}
   │  ├─ store/assignmentStore.ts
   │  └─ styles/globals.css
   ├─ .env.example
   └─ package.json
```

---

## Setup

### Prerequisites
- Node 20+
- A MongoDB connection (Atlas free tier works)
- A Redis connection (Upstash, Redis Cloud, or local). For Upstash, use the `rediss://` URL — `maxRetriesPerRequest: null` is already configured for BullMQ compatibility.
- A Groq API key — https://console.groq.com/keys

### 1) Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI, REDIS_URL, GROQ_API_KEY
npm install
npm run dev          # starts API on :4000 with in-process worker
```

Run the worker as a separate process (optional, for production):
```bash
npm run worker       # spawns its own socket.io on PORT+1
# In this mode, the frontend still receives updates via the
# 4s REST poll fallback; for true cross-process ws fan-out
# add a socket.io Redis adapter.
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env.local       # defaults point at http://localhost:4000
npm install
npm run dev                       # http://localhost:3000
```

Open http://localhost:3000 → **Create assignment** → fill the form → submit → watch live progress → land on the rendered paper.

---

## API

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/assignments` | multipart: `title, subject?, gradeLevel?, dueDate, instructions?, questionConfig (JSON), file?` | Validates, enqueues generation job |
| `GET`  | `/api/assignments` | — | Recent 50 (summary) |
| `GET`  | `/api/assignments/:id` | — | Full assignment incl. `sections[]` |
| `POST` | `/api/assignments/:id/regenerate` | — | Resets and re-enqueues |
| `GET`  | `/health` | — | Liveness |

Socket events (server → client, room `assignment:{id}`):
- `assignment:update` — `{ status, progress, message?, error? }`
- `assignment:done` — `{ assignmentId }`

Client → server: `subscribe`/`unsubscribe` with an `assignmentId`.

---

## Bonus features included
- **PDF export** via `html2canvas` + `jsPDF` (preserves layout, multi-page).
- **Print-friendly layout** (`@media print` strips chrome).
- **Regenerate** action with a single click.
- **Difficulty badges** color-coded (easy → emerald, moderate → amber, hard → rose).
- **Redis caching** of LLM raw responses (1h TTL).
- **Parser reconciliation** so output always matches teacher config.

---

## Notes & trade-offs
- The worker can run **in-process** (default in dev for simplicity) or **standalone**. For production with multiple worker replicas, attach a socket.io Redis adapter so all instances can fan out updates to subscribed clients.
- PDF text extraction is best-effort (`pdf-parse`); scanned PDFs (image-only) won't produce useful source text.
- All LLM responses are parsed + validated before persistence — the UI never renders raw model output.
