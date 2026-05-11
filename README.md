# Sniper Shooter — Vercel Deployment Guide

## What changed

The original bundled JS had two secrets hardcoded and visible to anyone:

| Secret | Was in JS? | Now |
|---|---|---|
| Backend API URL | ✅ Yes | ❌ Moved to `CHAT_API_URL` env var |
| Bearer token | ✅ Yes | ❌ Moved to `CHAT_API_TOKEN` env var |

A Vercel serverless function at `/api/chat` acts as a **proxy** — it receives
requests from your frontend, injects the real URL + token from environment
variables (server-side only), and forwards to the real backend.

## Deploy to Vercel

### 1. Install Vercel CLI (optional)
```bash
npm i -g vercel
```

### 2. Add Environment Variables in Vercel Dashboard

Go to: **Project → Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `CHAT_API_URL` | `https://dev-x-vision.vercel.app/api/chat` |
| `CHAT_API_TOKEN` | `devx-1c4m31f7r1ww1pcqg48rp4bfg7h8mgdi` |

Set scope to **Production**, **Preview**, and **Development** as needed.

### 3. Deploy
Either drag-and-drop this folder into vercel.com/new, or:
```bash
vercel --prod
```

## What about Supabase & Google API Key?

Your JS still contains:
- **Supabase Anon Key** — This is **safe to be public**. Supabase anon keys are
  designed for browser use; your Row Level Security (RLS) policies protect your data.
- **Google API Key** (`AIzaSy...`) — Restrict it in Google Cloud Console to your
  Vercel domain to prevent abuse: **APIs & Services → Credentials → API key restrictions**.

## File structure
```
/
├── api/
│   └── chat.js          ← Serverless proxy (secret lives here)
├── css/
│   └── all.min.css
├── fonts/
├── js/
│   └── index-D5h5qMgN.js   ← Patched: no more hardcoded URL or token
├── index.html
└── vercel.json
```
