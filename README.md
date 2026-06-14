# PawLife — AI-Native Mini CRM

A marketing CRM for **PawLife**, an Indian D2C pet care brand. Helps marketers decide **who to reach**, **what to say**, and **which channel** to use — with AI woven into every step.

## Product POV

**AI campaign copilot** — autopilot surfaces opportunities from customer data, AI finds audiences and writes copy, marketer reviews and launches, system tracks live delivery via a callback-driven channel loop.

## Architecture

```
React (Vite)  →  FastAPI CRM (:8000)  →  MongoDB Atlas
                      ↓ asyncio.gather
               Channel Stub (:8001)  →  POST /api/receipts (callbacks)
                      ↓
                    Groq AI (segmentation, copy, insights)
```

## Features

- **Customer data** — 150 pet owners, ~400 orders (seed script)
- **Segmentation** — manual filters + Groq natural-language audience finding
- **Campaigns** — personalised messages with `{owner_name}` / `{pet_name}` placeholders
- **Autopilot** — 5 proactive suggestions (reorder, birthday, life-stage, win-back, VIP)
- **Live tracking** — campaign detail polls stats as channel callbacks arrive
- **AI insights** — post-campaign performance analysis via Groq

## Local setup

### 1. MongoDB + env

Copy `.env.example` → `.env` in each service and fill in values.

### 2. CRM backend

```bash
cd crm-backend
pip install -r requirements.txt
python seed.py          # load demo data
uvicorn server:app --reload --port 8000
```

### 3. Channel service

```bash
cd channel-service
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo flow

1. **Dashboard** → view stats + AI autopilot suggestions
2. Click **Launch Campaign** on "Food restock overdue"
3. Audience auto-loaded → generate AI message → select WhatsApp → launch
4. **Campaign detail** → watch live stats update → read AI insight
5. **Customers** → filter, search, view profile + restock prediction

## Deployment (Render + Vercel)

### 1. Provision managed services

- Create a MongoDB Atlas cluster and collect connection string for `MONGO_URL`.
- Create a Groq API key for `GROQ_API_KEY`.
- Generate one shared random value for `CALLBACK_SECRET` and set it in both backend services.

### 2. Deploy CRM backend on Render

- Use `crm-backend/render.yaml`.
- Configure:
  - `MONGO_URL`
  - `DB_NAME` (default: `pawlife`)
  - `GROQ_API_KEY`
  - `CHANNEL_SERVICE_URL`
  - `RENDER_EXTERNAL_URL` (public CRM URL)
  - `CALLBACK_SECRET`
  - `ALLOWED_ORIGINS` (comma-separated frontend origins)

### 3. Deploy channel service on Render

- Use `channel-service/render.yaml`.
- Configure:
  - `CRM_RECEIPT_URL` (e.g. `https://<crm-host>/api/receipts`)
  - `CALLBACK_SECRET` (same shared secret as CRM)
  - `ALLOWED_ORIGINS`

### 4. Deploy frontend on Vercel

- Deploy `frontend/`.
- `frontend/vercel.json` handles SPA rewrites.
- Set `VITE_API_URL=https://<crm-host>/api`.

### 5. Seed demo data once

Run `python seed.py` in deployed CRM runtime (or one-off job) after env setup.

### 6. Post-deploy validation

- CRM health: `GET /api/health`
- Channel health: `GET /health`
- Validate campaign launch flow:
  - Dashboard loads
  - Segment + campaign creation works
  - Send triggers channel callback
  - CRM receipts update campaign message stats
  - AI endpoints return responses

## Tradeoffs (conscious choices)

| At scale | For this scope |
|----------|----------------|
| Job queue (Celery/SQS) for sends | `asyncio.gather()` — sufficient for ~150 recipients |
| Full webhook platform & replay-protection | HMAC callback signature via shared `CALLBACK_SECRET` |
| Redis caching for autopilot | Full scan on each request — simple, correct |
| Microservices + routers | Modular helpers (`filters.py`, `autopilot.py`) in one deployable app |
| Real WhatsApp/SMS/Email | Separate stub service with probabilistic callbacks |

## Project structure

```
pawlife/
├── frontend/          React + Vite + Tailwind
├── crm-backend/       FastAPI + Motor + Groq
│   ├── server.py
│   ├── filters.py     Shared segmentation logic
│   ├── autopilot.py   Proactive campaign suggestions
│   └── seed.py
└── channel-service/   Message delivery stub
```

## API health

- CRM: `GET /api/health`
- Channel: `GET /health`
