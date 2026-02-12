# Install yt-dlp (for YouTube URLs)

yt-dlp is **only needed for YouTube links**. The "Upload Video" option does not use it.

---

## Option A: Run the PowerShell script (easiest on Windows)

From the **project root** in PowerShell:

```powershell
cd "D:\MACHINE LEARNING FROM WAQAS BHAI\PRACTICE PROJECTS\youtube_video_summarizer"
.\install-yt-dlp.ps1
```

If you get "script execution disabled", run once:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run `.\install-yt-dlp.ps1` again. Restart the backend and try a YouTube URL.

---

## Option B: Put executable in project manually

### Windows

1. **Download yt-dlp**
   - Open: https://github.com/yt-dlp/yt-dlp/releases
   - In the latest release, under "Assets", download **yt-dlp.exe** (or the Windows build if listed).

2. **Place the file in one of these folders** (create the folder if it doesn’t exist):
   - **`backend/bin/yt-dlp.exe`** (preferred), or  
   - **`bin/yt-dlp.exe`** (project root, i.e. same level as `backend` and `frontend`).

3. **Restart the backend** and try a YouTube URL again.

---

## Option C: Install via PATH

### Windows (winget)

```bash
winget install yt-dlp
```

Then restart the backend. It will use `yt-dlp` from your PATH.

### Windows (scoop)

```bash
scoop install yt-dlp
```

### Or set path in .env

If yt-dlp is installed somewhere else, add to your **.env** (project root):

```env
YT_DLP_PATH=C:\path\to\yt-dlp.exe
```

Restart the backend after changing .env.
