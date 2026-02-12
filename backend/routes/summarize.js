const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { videoQueue } = require('../queue/queue');
const { validateYouTubeURL } = require('../utils/url-validator');
const { getVideoInfo } = require('../services/youtube');
const { checkOpenAICredits } = require('../services/openai-check');
const { MAX_VIDEO_DURATION_SECONDS } = require('../config/constants');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/webm',
      'video/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a video file (mp4, mov, avi, wmv, webm, ogg).'));
    }
  }
});

/**
 * POST /summarize - Create a new summarization job
 */
router.post('/summarize', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Step 1: Validate URL is provided
    if (!url) {
      return res.status(400).json({ 
        error: 'YouTube URL is required',
        code: 'MISSING_URL'
      });
    }

    // Step 2: Validate it's a YouTube URL
    const urlValidation = validateYouTubeURL(url);
    if (!urlValidation.valid) {
      return res.status(400).json({
        error: urlValidation.error,
        code: 'INVALID_URL'
      });
    }

    // Step 3: Check OpenAI credits BEFORE creating job
    console.log('Checking OpenAI API credits...');
    const creditStatus = await checkOpenAICredits();
    
    if (!creditStatus.valid || !creditStatus.hasCredits) {
      return res.status(503).json({
        error: creditStatus.message,
        code: 'NO_OPENAI_CREDITS',
        details: 'The OpenAI API key credits are empty or invalid. Please contact the owner to add credits to their OpenAI account.'
      });
    }

    // Step 4: Check video duration BEFORE creating job
    console.log(`Checking video duration for: ${url}`);
    const videoInfo = await getVideoInfo(url);
    
    if (!videoInfo.valid) {
      const isYtDlpMissing = videoInfo.error === 'YT_DLP_NOT_INSTALLED';
      return res.status(400).json({
        error: isYtDlpMissing
          ? 'yt-dlp is not installed. YouTube URLs require yt-dlp to fetch and download videos.'
          : 'Failed to fetch video information',
        code: isYtDlpMissing ? 'YT_DLP_NOT_INSTALLED' : 'VIDEO_INFO_ERROR',
        details: isYtDlpMissing
          ? 'Install yt-dlp (see README) or use "Upload Video" to summarize a file from your computer instead.'
          : (videoInfo.error || 'Could not retrieve video details. Please check the URL.')
      });
    }

    const durationSeconds = videoInfo.duration || 0;
    const durationMinutes = Math.ceil(durationSeconds / 60);

    // Check if video is too long
    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      return res.status(400).json({
        error: `Video is too long (${durationMinutes} minutes). Maximum supported duration is ${Math.floor(MAX_VIDEO_DURATION_SECONDS / 60)} minutes (${MAX_VIDEO_DURATION_SECONDS / 3600} hours).`,
        code: 'VIDEO_TOO_LONG',
        duration: durationMinutes,
        maxDuration: Math.floor(MAX_VIDEO_DURATION_SECONDS / 60),
        videoTitle: videoInfo.title
      });
    }

    // Step 5: Create job and return job ID immediately
    const jobId = uuidv4();
    
    const jobData = {
      url,
      jobId,
      videoInfo: {
        title: videoInfo.title,
        duration: durationMinutes
      }
    };

    // Add job to queue (works with both Redis and memory queue)
    await videoQueue.add('summarize-video', jobData, {
      jobId // Use custom job ID
    });

    console.log(`✅ Job created: ${jobId} for video: "${videoInfo.title}"`);

    // Return job ID immediately (non-blocking)
    res.json({
      jobId,
      status: 'processing',
      message: 'Video summarization job created. Use GET /api/status/:jobId to check progress.',
      videoInfo: {
        title: videoInfo.title,
        duration: durationMinutes
      }
    });
  } catch (error) {
    console.error('Error creating job:', error.message);
    res.status(500).json({
      error: `Error creating summarization job: ${error.message}`,
      code: 'JOB_CREATION_ERROR'
    });
  }
});

/**
 * POST /upload - Upload and process a video file
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No video file uploaded',
        code: 'MISSING_FILE'
      });
    }

    const videoFilePath = req.file.path;
    const fileName = req.file.originalname;

    // Step 1: Check OpenAI credits BEFORE processing
    console.log('Checking OpenAI API credits...');
    const creditStatus = await checkOpenAICredits();
    
    if (!creditStatus.valid || !creditStatus.hasCredits) {
      fs.unlinkSync(videoFilePath);
      return res.status(503).json({
        error: creditStatus.message,
        code: 'NO_OPENAI_CREDITS',
        details: 'The OpenAI API key credits are empty or invalid. Please contact the owner to add credits to their OpenAI account.'
      });
    }

    // Step 2: No duration check for uploaded files — accept and process directly
    console.log(`Uploaded file accepted: ${fileName}. Will extract audio, transcribe, and summarize.`);

    const jobId = uuidv4();
    
    const jobData = {
      videoFilePath,
      isUploadedFile: true,
      jobId,
      videoInfo: {
        title: fileName,
        duration: null
      }
    };

    // Add job to queue (works with both Redis and memory queue)
    await videoQueue.add('summarize-video', jobData, {
      jobId // Use custom job ID
    });

    console.log(`✅ Job created: ${jobId} for uploaded video: "${fileName}"`);

    // Return job ID immediately (non-blocking)
    res.json({
      jobId,
      status: 'processing',
      message: 'Video summarization job created. Use GET /api/status/:jobId to check progress.',
      videoInfo: {
        title: fileName,
        duration: null
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError.message);
      }
    }

    console.error('Error creating upload job:', error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum file size is 500MB.',
        code: 'FILE_TOO_LARGE'
      });
    }

    res.status(500).json({
      error: `Error creating summarization job: ${error.message}`,
      code: 'JOB_CREATION_ERROR'
    });
  }
});

/**
 * GET /status/:jobId - Get job status
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Get job by ID
    const job = await videoQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        code: 'JOB_NOT_FOUND',
        message: `No job found with ID: ${jobId}`
      });
    }

    // Get job state (works with both BullMQ and memory queue)
    let state = 'waiting';
    if (job.getState) {
      state = await job.getState();
    } else {
      // Memory queue
      state = job.state || 'waiting';
    }
    
    // Get progress (can be object or number)
    let progressData = job.progress || {};
    let progressPercent = 0;
    let stage = 'pending';
    
    if (typeof progressData === 'object') {
      progressPercent = progressData.progress || 0;
      stage = progressData.stage || 'pending';
    } else {
      progressPercent = progressData;
    }

    let response = {
      jobId,
      status: state,
      progress: progressPercent,
      stage: stage
    };

    // If completed, include results
    if (state === 'completed') {
      try {
        const result = job.returnvalue || (await job.returnvalue);
        if (result) {
          response.summary = result.summary;
          response.transcript = result.transcript;
          response.videoInfo = result.videoInfo;
        }
      } catch (resultError) {
        console.error('Error getting job result:', resultError);
        response.error = 'Could not retrieve job results';
      }
    }

    // If failed, include error
    if (state === 'failed') {
      response.error = job.failedReason || 'Job failed';
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting job status:', error.message);
    res.status(500).json({
      error: `Error getting job status: ${error.message}`,
      code: 'STATUS_ERROR'
    });
  }
});

module.exports = router;
