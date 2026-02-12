# Redis Installation Guide (Optional)

## ⚠️ Important Note

**Redis is OPTIONAL!** The system works perfectly fine without Redis using an in-memory queue.

Redis is only needed if you want:
- Job persistence (jobs survive server restarts)
- Better scalability
- Production-ready setup

## 🚀 Quick Install Options

### Option 1: Memurai (Easiest - Windows Native)

1. Download Memurai from: https://www.memurai.com/get-memurai
2. Install the .msi file
3. Redis will start automatically as a Windows service
4. **Done!** Your backend will automatically detect and use it

### Option 2: Docker (If you have Docker)

```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Option 3: WSL (If WSL is fully set up)

```bash
# In WSL terminal:
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

### Option 4: Manual Download

1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Extract the zip file
3. Run `redis-server.exe` from the extracted folder

## ✅ Verify Redis is Running

After installation, check if Redis is running:

```bash
redis-cli ping
# Should return: PONG
```

## 🔄 Restart Your Backend

After installing Redis, restart your backend server:

```bash
npm run dev
```

You should see:
```
✅ Redis connected
✅ Redis is available - using BullMQ
🚀 Video processor worker started (Redis/BullMQ)
```

## 💡 Current Status

Right now, your system is working with **in-memory queue** (no Redis needed). This is fine for development and testing!
