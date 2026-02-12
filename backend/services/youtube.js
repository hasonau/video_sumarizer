const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Use YT_DLP_PATH from .env if set (fixes "not recognized" when PATH differs for Node)
const ytDlpCommand = (() => {
  try {
    const { YT_DLP_COMMAND } = require('../config/constants');
    return YT_DLP_COMMAND || 'yt-dlp';
  } catch (_) {
    return process.env.YT_DLP_PATH ? process.env.YT_DLP_PATH.trim() : 'yt-dlp';
  }
})();

/**
 * Get video information (duration, title) without downloading
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object>} - Video info with duration in seconds
 */
async function getVideoInfo(url) {
  try {
    const command = `"${ytDlpCommand}" --dump-json --no-download --no-playlist "${url}"`;
    
    console.log('📡 Fetching video information (NO DOWNLOAD)...');
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000 // 30 second timeout
    });
    
    // Parse stderr for warnings (but don't fail on warnings)
    if (stderr) {
      const warnings = stderr.split('\n').filter(line => 
        line.includes('WARNING') && !line.includes('JavaScript runtime')
      );
      if (warnings.length > 0) {
        console.warn('Video info warnings:', warnings.join('; '));
      }
    }
    
    if (!stdout || stdout.trim().length === 0) {
      throw new Error('No video information returned from yt-dlp');
    }
    
    const videoInfo = JSON.parse(stdout);
    
    if (!videoInfo) {
      throw new Error('Invalid video information received');
    }
    
    const duration = videoInfo.duration || 0; // Duration in seconds
    const title = videoInfo.title || 'Unknown';
    
    if (duration === 0 || !duration) {
      console.warn('⚠️  Video duration is 0 or undefined. Video might be live or unavailable.');
    }
    
    const durationMinutes = Math.ceil(duration / 60);
    
    console.log(`✅ Video info retrieved: "${title}" - ${duration} seconds (${durationMinutes} minutes)`);
    
    return {
      duration, // in seconds
      durationMinutes,
      title,
      valid: true
    };
  } catch (error) {
    console.error('❌ Error fetching video info:', error.message);
    const msg = error.message || '';
    const isYtDlpMissing = msg.includes('yt-dlp') && (msg.includes('not recognized') || msg.includes('not found') || msg.includes('ENOENT') || msg.includes('command not found'));
    return {
      valid: false,
      error: isYtDlpMissing
        ? 'YT_DLP_NOT_INSTALLED'
        : error.message
    };
  }
}

/**
 * Download audio from YouTube URL using yt-dlp
 * @param {string} url - YouTube video URL
 * @returns {Promise<string>} - Path to downloaded audio file
 */
async function downloadAudio(url) {
  const outputDir = path.join(__dirname, '..');
  const outputTemplate = path.join(outputDir, 'audio.%(ext)s');
  
  try {
    // Download best audio format without conversion (no ffmpeg needed)
    const command = `"${ytDlpCommand}" -f "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio" -o "${outputTemplate}" "${url}"`;
    
    console.log('⬇️  Downloading audio (best available format)...');
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Check for downloaded file (yt-dlp will add the extension)
    const possibleExtensions = ['.m4a', '.webm', '.opus', '.ogg', '.mp3'];
    let downloadedFile = null;
    
    for (const ext of possibleExtensions) {
      const filePath = path.join(__dirname, '..', `audio${ext}`);
      if (fs.existsSync(filePath)) {
        downloadedFile = filePath;
        console.log(`✅ Audio file downloaded: ${downloadedFile}`);
        break;
      }
    }
    
    if (downloadedFile) {
      return downloadedFile;
    }
    
    throw new Error('Audio file was not created after download');
  } catch (error) {
    const msg = error.message || '';
    const isYtDlpMissing = msg.includes('yt-dlp') && (msg.includes('not recognized') || msg.includes('not found') || msg.includes('ENOENT') || msg.includes('command not found'));
    if (isYtDlpMissing) {
      throw new Error('YT_DLP_NOT_INSTALLED');
    }
    throw new Error(`Failed to download audio: ${error.message}`);
  }
}

module.exports = { downloadAudio, getVideoInfo };
