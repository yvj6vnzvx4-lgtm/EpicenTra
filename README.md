# EpicenTra

AI-powered event management platform for experiential marketing and brand activations. Built as a Capstone project.

## Features

- **Event Workspace** — specs, 3D space designer, collaborative notes, agent tasks
- **Planning Agent** — Groq-powered AI (llama-3.3-70b) with full event context
- **Real-time Collaboration** — Socket.io presence, typing indicators, live notes feed
- **Plan Lock / Execution** — lock flow with execution status board
- **Analytics** — cross-event charts, budget analysis, team activity
- **Per-Event Reports** — printable PDF summaries

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Docker) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth.js v4 (credentials + JWT) |
| AI | Groq API via Vercel AI SDK (`llama-3.3-70b-versatile`) |
| Real-time | Socket.io (Express server on port 3001) |
| 3D Design | React Three Fiber v8 + Three.js |
| Charts | Recharts |

## Setup

### Prerequisites

- Node.js 18+
- Docker Desktop

### 1. Clone & Install

```bash
git clone <repo-url>
cd epicentra
npm install --legacy-peer-deps
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Environment Variables

Create `.env` (for Prisma CLI):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/epicentra
```

Create `.env.local` (for Next.js):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/epicentra
NEXTAUTH_SECRET=your-secret-here-change-in-production
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
GROQ_API_KEY=your-groq-api-key
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

Generate a NextAuth secret:

```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Run

```bash
npm run dev
```

This starts both the Next.js app (port 3000) and the Socket.io server (port 3001) via `concurrently`.

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| sarah@acme.com | password123 | Director |
| james@acme.com | password123 | Manager |
| alex@acme.com | password123 | Coordinator |

## Architecture

```
epicentra/
├── app/                        # Next.js App Router
│   ├── (auth)/login/           # Login page
│   ├── (dashboard)/            # Protected shell
│   │   ├── dashboard/          # Overview
│   │   ├── events/[eventId]/   # Event workspace
│   │   ├── analytics/          # Cross-event analytics
│   │   └── settings/           # Profile & team management
│   └── api/                    # API routes
├── components/
│   ├── layout/                 # Sidebar, Header, CommandPalette
│   ├── events/                 # Workspace components
│   ├── analytics/              # Charts & reports
│   └── ui/                     # Shared UI primitives
├── lib/
│   ├── agent-service.ts        # Groq AI integration
│   ├── analytics.ts            # Analytics data queries
│   ├── auth.ts                 # NextAuth config
│   └── prisma.ts               # Prisma client singleton
├── server/
│   └── index.ts                # Socket.io Express server
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Open command palette / search |
| `⌘Enter` | Send message in Notes chat |

## Notes

- The Socket.io server runs separately from Next.js — both must be running for real-time features
- The AI agent requires a `GROQ_API_KEY` — without it, a graceful fallback message is shown
- React Three Fiber is pinned to v8 due to a React 19 peer dependency conflict
- Prisma 7 requires `@prisma/adapter-pg` — the `url` field must not be in `schema.prisma`
