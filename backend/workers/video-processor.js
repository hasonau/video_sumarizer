const { videoQueue, useRedis } = require('../queue/queue');
const { downloadAudio, getVideoInfo } = require('../services/youtube');
const { extractAudioFromVideo } = require('../services/video-file');
const { transcribeAudioChunked } = require('../services/transcribe');
const { summarizeTranscriptMapReduce } = require('../services/summarize');
const { checkOpenAICredits } = require('../services/openai-check');
const { MAX_VIDEO_DURATION_SECONDS } = require('../config/constants');
const fs = require('fs');
const path = require('path');

/**
 * Process video summarization job
 */
async function processVideoJob(job) {
  // Handle both BullMQ job format and memory queue format
  const jobData = job.data || job;
  const url = jobData.url;
  const videoFilePath = jobData.videoFilePath;
  const isUploadedFile = jobData.isUploadedFile || false;
  const jobId = job.id || jobData.jobId || 'memory';
  let audioFile = null;
  let uploadedVideoFile = null;

  try {
    // Update job progress
    await updateJobProgress(job, { stage: 'checking_credits', progress: 5 });

    // Step 1: Check OpenAI credits
    console.log(`[Job ${jobId}] Checking OpenAI API credits...`);
    const creditStatus = await checkOpenAICredits();
    
    if (!creditStatus.valid || !creditStatus.hasCredits) {
      throw new Error(`OpenAI API credits issue: ${creditStatus.message}`);
    }

    await updateJobProgress(job, { stage: 'checking_duration', progress: 10 });

    let videoInfo;
    let durationSeconds;
    let durationMinutes;

    // Step 2: Uploaded file — no duration check; go straight to extract audio
    if (isUploadedFile && videoFilePath) {
      console.log(`[Job ${jobId}] Processing uploaded video file...`);
      uploadedVideoFile = videoFilePath;
      videoInfo = jobData.videoInfo || { title: 'Uploaded video', duration: null };
      durationMinutes = videoInfo.duration;

      await updateJobProgress(job, { 
        stage: 'extracting_audio', 
        progress: 20,
        videoInfo: { title: videoInfo.title, duration: videoInfo.duration }
      });

      console.log(`[Job ${jobId}] Extracting audio from video file...`);
      audioFile = await extractAudioFromVideo(videoFilePath);
      console.log(`[Job ${jobId}] Audio extracted: ${audioFile}`);
    } else {
      // YouTube URL processing (existing logic)
      console.log(`[Job ${jobId}] Checking video duration...`);
      videoInfo = await getVideoInfo(url);
      
      if (!videoInfo.valid) {
        throw new Error(`Failed to fetch video info: ${videoInfo.error}`);
      }

      durationSeconds = videoInfo.duration || 0;
      durationMinutes = Math.ceil(durationSeconds / 60);

      if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        throw new Error(
          `Video too long (${durationMinutes} minutes). Maximum supported duration is ${Math.floor(MAX_VIDEO_DURATION_SECONDS / 60)} minutes.`
        );
      }

      await updateJobProgress(job, { 
        stage: 'downloading', 
        progress: 20,
        videoInfo: {
          title: videoInfo.title,
          duration: durationMinutes
        }
      });

      // Step 3: Download audio from YouTube
      console.log(`[Job ${jobId}] Downloading audio...`);
      audioFile = await downloadAudio(url);
      console.log(`[Job ${jobId}] Audio downloaded: ${audioFile}`);
    }

    await updateJobProgress(job, { stage: 'transcribing', progress: 40 });

    // Step 4: Transcribe audio (with chunking for long videos)
    console.log(`[Job ${jobId}] Transcribing audio...`);
    const transcript = await transcribeAudioChunked(audioFile, (progress) => {
      updateJobProgress(job, { 
        stage: 'transcribing', 
        progress: 40 + (progress * 0.3) // 40-70% for transcription
      });
    });

    console.log(`[Job ${jobId}] Transcription completed: ${transcript.length} characters`);

    await updateJobProgress(job, { stage: 'summarizing', progress: 70 });

    // Step 5: Summarize transcript (map-reduce pattern)
    console.log(`[Job ${jobId}] Summarizing transcript...`);
    const summary = await summarizeTranscriptMapReduce(transcript, (progress) => {
      updateJobProgress(job, { 
        stage: 'summarizing', 
        progress: 70 + (progress * 0.25) // 70-95% for summarization
      });
    });

    console.log(`[Job ${jobId}] Summary completed`);

    await updateJobProgress(job, { stage: 'completed', progress: 100 });

    // Clean up audio file
    if (audioFile && fs.existsSync(audioFile)) {
      try {
        fs.unlinkSync(audioFile);
        console.log(`[Job ${jobId}] Cleaned up audio file`);
      } catch (cleanupError) {
        console.warn(`[Job ${jobId}] Failed to cleanup audio file:`, cleanupError.message);
      }
    }

    // Clean up uploaded video file (if it was an uploaded file)
    if (uploadedVideoFile && fs.existsSync(uploadedVideoFile)) {
      try {
        fs.unlinkSync(uploadedVideoFile);
        console.log(`[Job ${jobId}] Cleaned up uploaded video file`);
      } catch (cleanupError) {
        console.warn(`[Job ${jobId}] Failed to cleanup uploaded video file:`, cleanupError.message);
      }
    }

    return {
      transcript,
      summary,
      videoInfo: {
        title: videoInfo.title,
        duration: durationMinutes ?? null
      }
    };
  } catch (error) {
    console.error(`[Job ${jobId}] Error:`, error.message);
    
    // Clean up audio file on error
    if (audioFile && fs.existsSync(audioFile)) {
      try {
        fs.unlinkSync(audioFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    // Clean up uploaded video file on error
    if (uploadedVideoFile && fs.existsSync(uploadedVideoFile)) {
      try {
        fs.unlinkSync(uploadedVideoFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    throw error;
  }
}

// Helper to update job progress (works with both BullMQ and memory queue)
async function updateJobProgress(job, progressData) {
  if (job.updateProgress && typeof job.updateProgress === 'function') {
    // BullMQ job
    await job.updateProgress(progressData);
  } else {
    // Memory queue - update directly
    if (job.progress) {
      Object.assign(job.progress, progressData);
    } else {
      job.progress = progressData;
    }
  }
}

// Register memory queue worker (always works, even as fallback)
const { memoryQueue } = require('../queue/memory-queue');

memoryQueue.registerWorker(async (job) => {
  return await processVideoJob(job);
});

// Try to start BullMQ worker if Redis is available (check after a delay)
setTimeout(() => {
  const queueInfo = require('../queue/queue');
  
  if (queueInfo.useRedis) {
    try {
      const { Worker } = require('bullmq');
      const { connection, QUEUE_NAME } = require('../queue/queue');
      
      const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          return await processVideoJob(job);
        },
        {
          connection,
          concurrency: 1
        }
      );

      worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed successfully (Redis)`);
      });

      worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job.id} failed:`, err.message);
      });

      worker.on('error', (err) => {
        console.error('Worker error:', err);
      });

      console.log('🚀 BullMQ worker started (Redis)');
    } catch (error) {
      console.warn('⚠️  Could not start BullMQ worker:', error.message);
    }
  } else {
    console.log('🚀 Video processor worker started (In-Memory Queue)');
    console.log('💡 Note: Jobs are lost on server restart. Install Redis for persistence.');
  }
}, 1000); // Wait 1 second for Redis connection to establish

module.exports = { processVideoJob };
