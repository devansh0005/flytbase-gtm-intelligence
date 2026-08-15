# Railway Deployment Guide
**Application**: FlytBase GTM Intelligence  
**Target Platform**: Railway (Persistent Container)

---

## 1. Overview & Architecture

Deploying to **Railway** provides a containerized Node.js runtime with a persistent disk volume, preserving the SQLite normalized cache (`dev.db`), automated SHA-256 diffing, and continuous intelligence re-evaluation without requiring database migration.

---

## 2. Step-by-Step Railway Deployment

### Step 1: Create New Project on Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Select `devansh0005/flytbase-gtm-intelligence`.

### Step 2: Configure Environment Variables
In your Railway Service dashboard, go to the **Variables** tab and add:

| Variable | Recommended Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Path to the normalized SQLite store |
| `FLYTBASE_MCP_ENDPOINT` | `https://flytbase-gtm-hackathon.lovable.app/api/mcp` | Source of truth MCP streamable endpoint |
| `FLYTBASE_MCP_TOKEN` | `[YOUR_SECRET_BEARER_TOKEN]` | Authentication bearer token |
| `GEMINI_API_KEY` | *(Optional)* | Gemini 2.0 Flash reasoning key (gracefully falls back if omitted) |
| `NODE_ENV` | `production` | Production environment flag |

> **Security Notice**: Never paste real credentials into source code. Always input secrets through the Railway Variables UI.

### Step 3: Configure Build & Start Commands
In your Railway Service dashboard, go to the **Settings** tab:

- **Build Command**:
  ```bash
  npx prisma db push && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```
- **Healthcheck Path**:
  ```text
  /api/sync
  ```

### Step 4: (Optional) Attach a Persistent Volume
To ensure database persistence across redeployments:
1. In Railway canvas, click **+ New** $\rightarrow$ **Volume**.
2. Mount the volume to your service with Mount Path: `/app` or `/data`.
3. If mounted at `/data`, set `DATABASE_URL="file:/data/dev.db"`.

---

## 3. Post-Deployment Verification

Once Railway deploys and provides a public domain (e.g. `https://flytbase-gtm-intelligence.up.railway.app`), verify the primary routes:

1. **Dashboard Overview**: `GET /` $\longrightarrow$ Verify 14 accounts, metrics, action queue, and portfolio signals render.
2. **Sync & Audit Trail**: `GET /changes` $\longrightarrow$ Verify Sync state is `IDLE` with 0 delta drift.
3. **Account 360 & Decision Chain**: `GET /accounts/coastline-transit` $\longrightarrow$ Verify telemetry charts and explainable decision chain.
4. **Trigger Live Sync**: Click the **Sync** button in the header or `POST /api/sync` to verify bidirectional communication with FlytBase MCP.

---

## 4. Troubleshooting & Logging

- **Build Logs**: Check Railway Build Logs to confirm `prisma generate` and Next.js static generation completed with 0 errors.
- **Deploy Logs**: Check Deploy Logs for `▲ Next.js Ready in XXXms` and HTTP 200 responses on `/api/sync`.
