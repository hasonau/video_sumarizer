const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Get video information (duration, title) without downloading
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object>} - Video info with duration in seconds
 */
async function getVideoInfo(url) {
  try {
    // Get video info as JSON without downloading (--no-download is CRITICAL)
    const command = `yt-dlp --dump-json --no-download --no-playlist "${url}"`;
    
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
    console.error('Full error:', error);
    // Re-throw to ensure it's caught properly
    throw new Error(`Failed to get video information: ${error.message}`);
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
    // First, try to download best audio format without conversion (no ffmpeg needed)
    // This downloads the best available audio format directly
    let command = `yt-dlp -f "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio" -o "${outputTemplate}" "${url}"`;
    
    console.log('Downloading audio (best available format)...');
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Check for downloaded file (yt-dlp will add the extension)
    const possibleExtensions = ['.m4a', '.webm', '.opus', '.ogg', '.mp3'];
    let downloadedFile = null;
    
    for (const ext of possibleExtensions) {
      const filePath = path.join(outputDir, `audio${ext}`);
      if (fs.existsSync(filePath)) {
        downloadedFile = filePath;
        console.log(`Audio file downloaded: ${downloadedFile}`);
        break;
      }
    }
    
    if (downloadedFile) {
      return downloadedFile;
    }
    
    // If no file found, try with explicit mp3 conversion (requires ffmpeg)
    console.log('Trying with mp3 conversion (requires ffmpeg)...');
    const mp3Path = path.join(outputDir, 'audio.mp3');
    command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${mp3Path}" "${url}"`;
    
    try {
      await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      if (fs.existsSync(mp3Path)) {
        return mp3Path;
      }
    } catch (ffmpegError) {
      if (ffmpegError.message.includes('ffmpeg') || ffmpegError.message.includes('ffprobe')) {
        throw new Error(
          'ffmpeg is required for MP3 conversion. ' +
          'Please install ffmpeg from https://ffmpeg.org/download.html ' +
          'OR the download will use the best available audio format (m4a/webm) which works fine.'
        );
      }
      throw ffmpegError;
    }
    
    throw new Error('Audio file was not created after download');
  } catch (error) {
    // Provide helpful error message
    if (error.message.includes('ffmpeg') || error.message.includes('ffprobe')) {
      throw new Error(
        'ffmpeg not found. Install from https://ffmpeg.org/download.html\n' +
        'Alternatively, the code will try to download best available audio format without conversion.'
      );
    }
    throw new Error(`Failed to download audio: ${error.message}`);
  }
}

module.exports = { downloadAudio, getVideoInfo };
