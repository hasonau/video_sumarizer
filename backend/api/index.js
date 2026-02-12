// Minimal Vercel serverless handler – no queue, multer, or filesystem.
// Full app (summarize/upload) needs a real server (e.g. Render).
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '')) {
    res.status(200).json({
      success: true,
      message: 'Server is running (deployed on Vercel)',
      status: 'ok',
      deployed: true,
      version: '2.0.0',
      endpoints: {
        'POST /api/summarize': 'YouTube URL – use a full server (e.g. Render)',
        'POST /api/upload': 'Upload video – use a full server (e.g. Render)',
        'GET /api/status/:jobId': 'Job status – use a full server (e.g. Render)'
      }
    });
    return;
  }

  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'This Vercel deployment only serves GET /. For full API, deploy backend on Render.'
  });
};
