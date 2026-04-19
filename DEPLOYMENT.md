# Deployment Guide (Render + Vercel)

## 1) Deploy Backend on Render

This backend is ready to run on Render as a Node web service.
The repository also includes an automatic keep-alive cron service so your backend is hit periodically.

### Option A: Blueprint (recommended)

1. Push this backend folder to GitHub.
2. In Render, choose New > Blueprint.
3. Select the repository containing this backend.
4. Render will detect render.yaml and create the service.
5. Fill all env vars marked as `sync: false` in Render dashboard.

### Option B: Manual Web Service

1. New > Web Service
2. Environment: Node
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables listed below.

## 2) Required Render Environment Variables

- `NODE_ENV=production`
- `PORT=10000`
- `DB_HOST=<your_mysql_host>`
- `DB_PORT=3306`
- `DB_NAME=<your_db_name>`
- `DB_USER=<your_db_user>`
- `DB_PASSWORD=<your_db_password>`
- `JWT_SECRET=<strong_secret>`
- `JWT_EXPIRE=7d`
- `JWT_REFRESH_SECRET=<strong_refresh_secret>`
- `JWT_REFRESH_EXPIRE=30d`
- `CORS_ORIGIN=https://<your-vercel-project>.vercel.app`
- `FRONTEND_URL=https://<your-vercel-project>.vercel.app`
- `EMAIL_NOTIFICATIONS_ENABLED=false` (or configure SMTP vars)

## 2.1) Enable Automatic Keep-Alive (Prevents Frequent Cold Starts)

`render.yaml` includes a cron service: `gearguard-backend-keepalive`.

1. In Render, open the cron service env vars.
2. Add:
   - `BACKEND_URL=https://<your-render-service>.onrender.com`
3. Keep schedule as every 10 minutes (`*/10 * * * *`).

This service automatically calls `GET /api/health` on your backend, so it gets hit automatically and stays responsive.

## 3) Deploy Frontend on Vercel

1. Push frontend folder (`GearGuard-Frontend`) to GitHub.
2. In Vercel, import the repository.
3. Framework Preset: Vite.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add env var:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api`
7. Deploy.

## 4) Verify

- Open backend URL in browser: `https://<render-service>.onrender.com/`
- Open frontend URL and test login + requests page.
- Confirm API calls in browser Network tab go to your Render URL.
