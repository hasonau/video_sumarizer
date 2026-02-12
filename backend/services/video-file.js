const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Extract audio from uploaded video file using ffmpeg
 * @param {string} videoFilePath - Path to video file
 * @returns {Promise<string>} - Path to extracted audio file
 */
async function extractAudioFromVideo(videoFilePath) {
  const outputDir = path.join(__dirname, '..');
  const audioFilePath = path.join(outputDir, 'audio.mp3');

  try {
    const command = `ffmpeg -i "${videoFilePath}" -vn -acodec libmp3lame -ar 44100 -ac 2 "${audioFilePath}" -y`;

    console.log('🎵 Extracting audio from video file...');
    await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000
    });

    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio extraction failed - output file not created');
    }

    console.log(`✅ Audio extracted: ${audioFilePath}`);
    return audioFilePath;
  } catch (error) {
    if (error.message.includes('ffmpeg') || error.code === 'ENOENT') {
      throw new Error(
        'ffmpeg is required to extract audio from video files. ' +
        'Please install ffmpeg: https://ffmpeg.org/download.html'
      );
    }
    throw new Error(`Failed to extract audio from video: ${error.message}`);
  }
}

module.exports = { extractAudioFromVideo };
