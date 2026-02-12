# YouTube Video Summarizer 🎬

A production-ready Node.js + React application that downloads YouTube videos, transcribes them using OpenAI Whisper, and summarizes the content using GPT-3.5-turbo with map-reduce pattern.

## 🚀 Features

- ✅ **Background Job Processing** - Non-blocking requests using BullMQ
- ✅ **YouTube URL Validation** - Only accepts YouTube URLs
- ✅ **Video Duration Checking** - Validates duration before processing (max 2 hours)
- ✅ **OpenAI Credits Check** - Validates API credits before processing
- ✅ **Map-Reduce Summarization** - Parallel chunk processing for speed
- ✅ **Real-time Progress Updates** - Frontend polls job status
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Auto Cleanup** - Temporary files deleted after processing

## 📋 Prerequisites

- Node.js (v16 or higher)
- Redis (for job queue)
- yt-dlp installed on your system
- ffmpeg installed on your system (required for video file uploads)
- OpenAI API key

## 🛠️ Installation

### 1. Install System Dependencies

**Redis:**
```bash
# Windows (using chocolatey)
choco install redis-64

# Or download from: https://redis.io/download
```

**yt-dlp (Required for YouTube URLs only):**
```bash
# Download from: https://github.com/yt-dlp/yt-dlp/releases
# Or use chocolatey: choco install yt-dlp
# Add yt-dlp to your PATH. Without it, use "Upload Video" instead of YouTube links.
```

**ffmpeg (Required for video file uploads):**
```bash
# Windows (using chocolatey - recommended)
choco install ffmpeg

# Or download manually:
# 1. Go to: https://www.gyan.dev/ffmpeg/builds/
# 2. Download "ffmpeg-release-essentials.zip"
# 3. Extract to C:\ffmpeg
# 4. Add C:\ffmpeg\bin to your PATH environment variable
# 5. Restart your terminal/command prompt
```

**Verify ffmpeg installation:**
```bash
ffmpeg -version
```
If you see version info, ffmpeg is installed correctly.

### 2. Install Node.js Dependencies

```bash
npm install
cd frontend
npm install
```

### 3. Configure Environment Variables

Edit `.env` file:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=5000
MAX_VIDEO_DURATION=7200  # 2 hours in seconds
REDIS_HOST=localhost
REDIS_PORT=6379
# If yt-dlp works in your terminal but not in the app, set full path:
# YT_DLP_PATH=C:\path\to\yt-dlp.exe
```

## 🏃 Running the Application

### Start Redis (Required for job queue)

```bash
# Windows
redis-server

# Or if installed as service, it may start automatically
```

### Terminal 1 - Backend:
```bash
npm run dev
```
Backend runs on `http://localhost:5000`

### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```
Frontend runs on `http://localhost:3000`

## 📡 API Endpoints

### POST /api/summarize
Create a summarization job

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "jobId": "abc-123-def",
  "status": "processing",
  "message": "Video summarization job created...",
  "videoInfo": {
    "title": "Video Title",
    "duration": 5
  }
}
```

### GET /api/status/:jobId
Get job status and results

**Response (Processing):**
```json
{
  "jobId": "abc-123-def",
  "status": "processing",
  "progress": 45,
  "stage": "transcribing"
}
```

**Response (Completed):**
```json
{
  "jobId": "abc-123-def",
  "status": "completed",
  "progress": 100,
  "summary": "...",
  "transcript": "...",
  "videoInfo": {...}
}
```

## 🏗️ Architecture

```
backend/
├── config/
│   └── constants.js      # Configuration constants
├── queue/
│   └── queue.js          # BullMQ job queue setup
├── workers/
│   └── video-processor.js # Background job processor
├── routes/
│   └── summarize.js      # API routes
├── services/
│   ├── youtube.js        # YouTube download & info
│   ├── transcribe.js     # Whisper transcription
│   ├── summarize.js      # GPT summarization
│   └── openai-check.js   # API credit validation
├── utils/
│   ├── url-validator.js  # URL validation
│   └── text-chunker.js   # Text chunking utility
└── index.js              # Express server
```

## 🔧 How It Works

1. **URL Validation** - Validates YouTube URL format
2. **Credits Check** - Verifies OpenAI API has credits
3. **Duration Check** - Fetches video metadata (no download)
4. **Job Creation** - Creates background job, returns job ID immediately
5. **Background Processing**:
   - Download audio
   - Transcribe with Whisper
   - Summarize with map-reduce pattern
6. **Status Polling** - Frontend polls `/api/status/:jobId` every 2 seconds
7. **Result Delivery** - Returns summary and transcript when complete

## ⚙️ Configuration

### Video Duration Limits

- **Maximum**: 2 hours (7200 seconds) - configurable via `MAX_VIDEO_DURATION` in `.env`
- Videos longer than this are rejected before download

### Rate Limiting

- 50 requests per 15 minutes per IP
- Configurable in `backend/index.js`

## 🐛 Troubleshooting

### Redis Connection Error
- Make sure Redis is running: `redis-server`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### Job Not Processing
- Check if worker is started (should see "Video processor worker started" in logs)
- Check Redis connection
- Check backend terminal for errors

### YouTube URL: "yt-dlp is not recognized" (or was working before, now it's not)
- The app runs in a different environment than your terminal, so it may not see the same PATH.
- **Option A:** Restart Cursor/IDE completely (close and reopen) so it picks up the updated PATH, then run the backend again.
- **Option B:** Set the full path in `.env`: `YT_DLP_PATH=C:\path\to\yt-dlp.exe` (e.g. where you downloaded or installed yt-dlp). Restart the backend after saving `.env`.
- yt-dlp is only needed for **YouTube URLs**. For local files use **Upload Video**.
- Download exe: https://github.com/yt-dlp/yt-dlp/releases

### Video Duration Check Failing
- Ensure yt-dlp is installed and accessible
- Check YouTube URL is valid and accessible
- Check network connection

### FFmpeg Not Found (Video File Uploads)
- **Install ffmpeg**: `choco install ffmpeg` (if using Chocolatey)
- **Or download manually**: https://www.gyan.dev/ffmpeg/builds/
- **Add to PATH**: Add `C:\ffmpeg\bin` to your system PATH environment variable
- **Restart terminal**: Close and reopen your terminal/command prompt after installation
- **Verify**: Run `ffmpeg -version` to confirm installation
- **Note**: FFmpeg is only required for uploading video files from your computer. YouTube videos don't need it.

## 📝 Notes

- **Non-blocking**: All processing happens in background
- **Scalable**: Can handle multiple jobs (currently 1 concurrent)
- **Cost-aware**: Checks credits and duration before processing
- **Production-ready**: Proper error handling, logging, cleanup

## 🔒 Security

- Rate limiting enabled
- Input validation (YouTube URLs only)
- Error messages don't expose sensitive info
- Temporary files cleaned up automatically
