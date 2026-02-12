# 🚀 Production Setup Guide

## Important: Redis Required

This application uses **Redis** for the job queue system. You MUST have Redis running before starting the backend.

### Install Redis (Windows)

**Option 1: Chocolatey (Recommended)**
```bash
choco install redis-64
```

**Option 2: Manual Download**
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`

**Option 3: WSL (Windows Subsystem for Linux)**
```bash
wsl
sudo apt-get install redis-server
redis-server
```

### Start Redis

**Windows:**
```bash
redis-server
```

**Or if installed as service:**
```bash
# Redis may start automatically
# Check if running:
redis-cli ping
# Should return: PONG
```

## 🏃 Quick Start

### 1. Start Redis
```bash
redis-server
```

### 2. Start Backend (Terminal 1)
```bash
npm run dev
```

### 3. Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```

## ✅ Verify Setup

1. **Check Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check backend logs:**
   - Should see: "🚀 Video processor worker started"
   - Should see: "🚀 Server running on http://localhost:5000"

3. **Test API:**
   - Open: `http://localhost:5000/`
   - Should see API info

## 🔧 Troubleshooting

### "Redis connection failed"
- Make sure Redis is running: `redis-server`
- Check `.env` has correct Redis host/port
- Default: `localhost:6379`

### "Worker not processing jobs"
- Check backend terminal for "Video processor worker started"
- Check Redis connection
- Check job queue logs

### "Job status not updating"
- Make sure frontend is polling `/api/status/:jobId`
- Check browser console for errors
- Verify backend is running

## 📊 Architecture Overview

```
User → Frontend → POST /api/summarize → Backend
                                    ↓
                              Creates Job → Redis Queue
                                    ↓
                              Returns jobId immediately
                                    ↓
                              Worker processes in background
                                    ↓
                              Frontend polls /api/status/:jobId
                                    ↓
                              Returns results when complete
```

## 🎯 Key Features

- ✅ **Non-blocking**: Jobs process in background
- ✅ **Scalable**: Can handle multiple concurrent requests
- ✅ **Resilient**: Failed jobs retry automatically
- ✅ **Efficient**: Map-reduce summarization pattern
- ✅ **Safe**: Duration and credit checks before processing
