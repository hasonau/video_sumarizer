# Deploy backend on Render (free tier)

**Free tier:** Yes. Web service spins down after ~15 min inactivity; next request wakes it (may take 30–60 sec). No credit card required.

Deploy backend first, then use the backend URL when you deploy the frontend (Vercel).

---

## Steps

### 1. Create account and service

1. Go to [render.com](https://render.com) → Sign up (GitHub is easiest).
2. **Dashboard** → **New +** → **Web Service**.
3. Connect your GitHub account if needed, then select repo **video_sumarizer** (or your repo name).
4. Click **Connect**.

### 2. Settings

| Field | Value |
|-------|--------|
| **Name** | `video-summarizer-api` (or any name) |
| **Region** | Choose closest to you |
| **Root Directory** | Leave **empty** (use whole repo) |
| **Runtime** | **Node** |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### 3. Environment variables

**Environment** → **Add Environment Variable**. Add:

| Key | Value |
|-----|--------|
| `OPENAI_API_KEY` | Your OpenAI key (from your .env) |
| `MAX_VIDEO_DURATION` | `7200` |
| `QUEUE_NAME` | `video-summarizer` |

**Do not add** `PORT` — Render sets it automatically.

**Redis (optional):**  
- Without Redis the app uses an in-memory queue (works, but jobs are lost on restart/spin-down).  
- For Redis: create a **Redis** instance on Render (free), then add:
  - `REDIS_HOST` = host from Redis dashboard  
  - `REDIS_PORT` = port (usually 6379)  
  - (and any password if shown)

### 4. Deploy

- Click **Create Web Service**.
- Render will clone the repo, run `npm install`, then `npm start`. First deploy may take a few minutes.
- When it’s live, the URL will be like:  
  `https://video-summarizer-api.onrender.com`

### 5. Use this URL for the frontend

When you deploy the frontend (e.g. on Vercel), set:

- **REACT_APP_API_URL** = `https://video-summarizer-api.onrender.com`  
  (use the URL Render shows for your service, no trailing slash)

---

## Limitation on free tier

Render’s free Node environment does **not** include **yt-dlp** or **ffmpeg**. So:

- **YouTube URL** and **uploaded video (audio extraction)** may fail with “yt-dlp not found” or “ffmpeg not found” when run on Render.
- The API and app will run; only the download/transcode steps that need those tools will fail.

To support YouTube and file upload on Render you’d need a **Docker** deploy that installs yt-dlp and ffmpeg in the image. If you want that later, we can add a Dockerfile.

For now you can still deploy to get the API live and the frontend talking to it; then add Docker/yt-dlp/ffmpeg if you need those features in production.
