# Deploy backend on Vercel (serverless)

The backend is set up so you can deploy it on **Vercel** as a serverless API. When deployed correctly, visiting the backend URL in a browser will show **"Server is running (deployed on Vercel)"**.

**Limitation:** On Vercel there are no yt-dlp, ffmpeg, or long-running workers. So **YouTube URL** and **upload + process** jobs will not complete (they need a real server like Render). Use Vercel for the backend only if you want a live "server is running" check and a place to add other serverless API routes later.

---

## Steps

1. **Vercel** → New Project → Import your repo.

2. **Configure the backend:**
   - **Root Directory:** `backend`
   - **Framework Preset:** Other (or leave default)
   - **Build Command:** `npm install` (or leave empty; Vercel runs install by default)
   - **Output Directory:** leave empty
   - **Install Command:** `npm install`

3. **Environment variables** (Settings → Environment Variables):
   - `OPENAI_API_KEY` = your key (optional for health check; needed if you add other API logic later)

4. Deploy. Vercel will build and deploy the serverless function.

5. **Your backend URL** will be like:  
   `https://your-project-name.vercel.app`

6. **Check it:** Open that URL in the browser. You should see JSON similar to:
   ```json
   {
     "success": true,
     "message": "Server is running (deployed on Vercel)",
     "status": "ok",
     "deployed": true,
     "version": "2.0.0",
     "endpoints": { ... }
   }
   ```
   That means the backend is deployed and running.

---

## Summary

| Deploy on | Good for                         | Limitation                          |
|-----------|-----------------------------------|-------------------------------------|
| **Vercel**| "Server is running" / health only | No yt-dlp, ffmpeg, or job workers   |
| **Render**| Full backend (YouTube + upload)   | See DEPLOY_BACKEND_RENDER.md        |

For full video summarization (YouTube + upload), deploy the backend on **Render**, not Vercel.
