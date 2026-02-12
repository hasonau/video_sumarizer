const fs = require('fs');
const OpenAI = require('openai');
const { TRANSCRIPTION_CHUNK_MINUTES } = require('../config/constants');

// Get and clean API key
let apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  apiKey = apiKey.trim();
}

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Initialize OpenAI client
const client = new OpenAI({ 
  apiKey: apiKey
});

/**
 * Transcribe audio file using OpenAI Whisper API (with chunking for long videos)
 * @param {string} filePath - Path to audio file
 * @param {Function} progressCallback - Callback for progress updates (0-1)
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudioChunked(filePath, progressCallback) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    console.log(`🎤 Transcribing file: ${filePath}`);
    
    // For now, transcribe the whole file
    // TODO: Implement audio chunking for very long files (>10 minutes)
    // This would require ffmpeg to split audio into chunks
    
    if (progressCallback) progressCallback(0.1);
    
    // Create read stream for the audio file
    const audioStream = fs.createReadStream(filePath);
    
    // Call Whisper API
    const transcription = await client.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    });

    if (progressCallback) progressCallback(0.9);

    const transcript = transcription.text || transcription;
    console.log(`✅ Transcription completed: ${transcript.length} characters`);
    
    if (progressCallback) progressCallback(1.0);
    
    return transcript;
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your .env file.');
    }
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

module.exports = { transcribeAudioChunked };
