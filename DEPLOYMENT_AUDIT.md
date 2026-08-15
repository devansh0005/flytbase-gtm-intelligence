# Deployment Audit & Architecture Compatibility Report
**Target Application**: FlytBase GTM Intelligence  
**Evaluated Platforms**: Vercel (Serverless) vs. Railway / Render / Fly.io (Persistent Container)

---

## 1. Executive Summary & Verdict

**Verdict**: **B. Requires database/deployment configuration adjustments before deploying to Vercel Serverless**, OR **Can deploy as-is to a Persistent Container platform (Railway / Render / Fly.io)**.

### Primary Architectural Consideration
The application relies on SQLite (`dev.db`) as the normalized local cache, document SHA-256 hash registry, and `ChangeEvent` audit store. 
- On **Vercel**, serverless Lambdas operate on an ephemeral, read-only filesystem where SQLite file writes either fail (`EROFS: read-only file system`) or reset on cold starts.
- On **Persistent Container Platforms (Railway / Render / Fly.io)**, the current SQLite database and Next.js server run with zero code modifications.

---

## 2. Technical Audit by Component

### A. Database & Persistence Layer (`prisma/schema.prisma`, `lib/db.ts`)
- **Current State**: `datasource db { provider = "sqlite", url = env("DATABASE_URL") }` pointing to `file:./dev.db`.
- **Vercel Serverless Behavior**: 
  - Vercel functions cannot persist SQLite files across invocations or across different lambda regions.
  - Bundled database files in the repository root are mounted read-only. Write operations (`POST /api/sync`, `db.changeEvent.create`, upserts) will throw runtime exceptions.
- **Hosted Postgres Solution**: Switching `provider = "postgresql"` with a hosted database (Neon, Supabase, or Vercel Postgres) provides 100% serverless compatibility with zero changes to application queries.

### B. Synchronization & Network Timeout (`lib/sync/sync-service.ts`, `app/api/sync/route.ts`)
- **Current State**: `SyncService.syncAll()` connects to the FlytBase MCP Server over Streamable HTTP, diffing 14 accounts, 87 documents, and 70 usage snapshots sequentially.
- **Execution Duration**: 5.2s – 7.4s.
- **Vercel Serverless Constraint**:
  - Default Vercel Hobby function timeout is **10 seconds**.
  - Under cold-start conditions or network latency, `POST /api/sync` could approach the 10s ceiling.
  - **Fix for Vercel**: Add `export const maxDuration = 60;` to `app/api/sync/route.ts`.

### C. Sync Triggering Mechanism
- **Current Triggering**:
  1. **Client Polling**: `SyncStatusBadge.tsx` polls `GET /api/sync` every 15 seconds to track sync state and detected changes.
  2. **On-Demand User Sync**: The `Sync` button issues a `POST /api/sync`.
  3. **Initial Bootstrap**: First application load runs bootstrap synchronization if accounts are empty.
- **Production Assessment**: Works smoothly across all deployment environments; no heavy daemon thread or unconstrained sleep loops required.

### D. File System & Media Storage
- All intelligence, evidence snippets, checksums, and change records are stored strictly in the database.
- Zero local image/media filesystem dependencies in production routes.

---

## 3. Required Production Environment Variables

| Variable | Required | Description | Example / Format |
|---|:---:|---|---|
| `DATABASE_URL` | **Yes** | Database connection string | `postgresql://user:pass@host/db` (Vercel) or `file:./dev.db` (Container) |
| `FLYTBASE_MCP_ENDPOINT` | **Yes** | FlytBase MCP Server URL | `https://flytbase-gtm-hackathon.lovable.app/api/mcp` |
| `FLYTBASE_MCP_TOKEN` | **Yes** | Bearer authentication token | `[SECRET_BEARER_TOKEN]` |
| `GEMINI_API_KEY` | *Optional* | Gemini 2.0 Flash reasoning key | `[SECRET_GEMINI_KEY]` (gracefully falls back if omitted) |
| `NODE_ENV` | **Yes** | Environment mode | `production` |

---

## 4. Recommended Deployment Paths

### Option 1: Railway / Render (Zero Code Changes — Recommended for SQLite)
- **Deployment Model**: Containerized Node.js runtime (`next start`) with persistent disk volume.
- **Code Changes Required**: **0** (Keep SQLite, Prisma schema untouched).
- **Steps**:
  1. Connect GitHub repository `devansh0005/flytbase-gtm-intelligence`.
  2. Set environment variables: `FLYTBASE_MCP_ENDPOINT`, `FLYTBASE_MCP_TOKEN`, `DATABASE_URL="file:./dev.db"`.
  3. Build command: `npx prisma db push && npm run build`.
  4. Start command: `npm start`.

### Option 2: Vercel Serverless Deployment (With Hosted Postgres)
- **Deployment Model**: Vercel Serverless Functions + Edge CDN.
- **Database**: Free-tier Neon Postgres, Supabase, or Vercel Postgres.
- **Adjustments Required**:
  1. Update `prisma/schema.prisma` datasource to `provider = "postgresql"`.
  2. Add `export const maxDuration = 60;` in `app/api/sync/route.ts`.
  3. Add `DATABASE_URL`, `FLYTBASE_MCP_ENDPOINT`, and `FLYTBASE_MCP_TOKEN` in Vercel Project Settings.

---

## 5. Security & Hygiene Checklist

- [x] `.env` excluded from git tracking via `.gitignore`.
- [x] `dev.db` excluded from git tracking via `.gitignore`.
- [x] Zero hardcoded API keys or bearer tokens in source files.
- [x] All MCP calls route through server-side `lib/mcp/client.ts` (tokens never exposed to client bundles).
