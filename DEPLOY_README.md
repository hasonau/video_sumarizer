# Where to deploy backend vs frontend

## Backend → use **Render** (not Vercel)

**Vercel does not run Node/Express servers.** It only runs:
- Static sites (e.g. your React build)
- Serverless functions (short-lived, no long-running Express app)

If you deploy the **backend** on Vercel, it will **not** execute `node backend/index.js`. You may see the raw `index.js` code because Vercel is serving the file instead of running it. So you will **not** see "APIs are running" on Vercel for the backend.

**Deploy the backend on Render:**

1. Go to [render.com](https://render.com) → New → Web Service.
2. Connect repo, then set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** leave empty
3. Add env vars (OPENAI_API_KEY, etc.).
4. Deploy. Your backend URL will be like: `https://video-summarizer-api.onrender.com`
5. Open that URL in the browser → you will see the JSON: `"message": "APIs are running"`.

See **DEPLOY_BACKEND_RENDER.md** for full steps.

---

## Frontend → use **Vercel**

1. New Project on Vercel → import same repo.
2. Set **Root Directory** to **`frontend`** (so only the React app is built).
3. Framework: Create React App. Build: `npm run build`. Output: `build`.
4. Add env var: **REACT_APP_API_URL** = your Render backend URL (e.g. `https://video-summarizer-api.onrender.com`).
5. Deploy. The main home screen will be your React app.

---

## Summary

| Part     | Deploy on | URL you get                    | Visiting it shows                    |
|----------|-----------|---------------------------------|--------------------------------------|
| Backend  | **Render**| https://xxx.onrender.com       | JSON: "APIs are running" + endpoints |
| Frontend | **Vercel**| https://xxx.vercel.app         | Your React app (input + summarize)   |

Do **not** deploy the backend on Vercel. Use Render for the backend so it actually runs and shows "APIs are running".
