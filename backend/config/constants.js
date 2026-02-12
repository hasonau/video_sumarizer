const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');

// Resolve yt-dlp: 1) YT_DLP_PATH in .env, 2) backend/bin/yt-dlp.exe, 3) project-root/bin/yt-dlp.exe, 4) "yt-dlp" (PATH)
const backendRoot = path.join(__dirname, '..');
const projectRoot = path.join(backendRoot, '..');
const backendBinYtDlp = path.join(backendRoot, 'bin', 'yt-dlp.exe');
const projectBinYtDlp = path.join(projectRoot, 'bin', 'yt-dlp.exe');
const envPath = process.env.YT_DLP_PATH ? process.env.YT_DLP_PATH.trim() : null;
const YT_DLP_COMMAND = envPath
  || (fs.existsSync(backendBinYtDlp) ? backendBinYtDlp : null)
  || (fs.existsSync(projectBinYtDlp) ? projectBinYtDlp : null)
  || 'yt-dlp';

module.exports = {
  YT_DLP_COMMAND,
  MAX_VIDEO_DURATION_SECONDS: parseInt(process.env.MAX_VIDEO_DURATION) || 7200, // 2 hours default
  MAX_VIDEO_DURATION_MINUTES: Math.floor((parseInt(process.env.MAX_VIDEO_DURATION) || 7200) / 60),
  PORT: process.env.PORT || 5000,
  REDIS: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  QUEUE_NAME: process.env.QUEUE_NAME || 'video-summarizer',
  CHUNK_SIZE_WORDS: 3000,
  TRANSCRIPTION_CHUNK_MINUTES: 10 // Split audio into 10-minute chunks for transcription
};
