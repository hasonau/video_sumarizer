import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'file'

  // Poll job status
  useEffect(() => {
    if (!jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/status/${jobId}`);
        const status = res.data.status;
        const progressData = res.data.progress || 0;
        const stage = res.data.stage || 'processing';
        
        // Update progress (can be number or object)
        const progressPercent = typeof progressData === 'number' ? progressData : progressData.progress || 0;
        setProgress(progressPercent);
        
        // Update job status (store as object with stage info)
        setJobStatus({
          status: status,
          stage: stage
        });

        if (status === 'completed') {
          setSummary(res.data.summary);
          setTranscript(res.data.transcript);
          setLoading(false);
          clearInterval(pollInterval);
        } else if (status === 'failed') {
          setError(res.data.error || 'Job failed');
          setLoading(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        if (err.response?.status === 404) {
          setError('Job not found. It may have expired or been deleted.');
          setLoading(false);
          clearInterval(pollInterval);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [jobId]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm', 'video/ogg'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a video file (mp4, mov, avi, wmv, webm, ogg).');
        return;
      }
      
      // Check file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        setError('File too large. Maximum file size is 500MB.');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setUrl(''); // Clear URL when file is selected
    }
  };

  const handleSummarize = async () => {
    if (inputMode === 'url' && !url) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    if (inputMode === 'file' && !selectedFile) {
      setError('Please select a video file');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setTranscript('');
    setJobId(null);
    setJobStatus(null);
    setProgress(0);

    try {
      let res;
      
      if (inputMode === 'file') {
        // Upload file
        const formData = new FormData();
        formData.append('video', selectedFile);
        
        res = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // YouTube URL
        res = await axios.post('http://localhost:5000/api/summarize', { url });
      }
      
      setJobId(res.data.jobId);
      setJobStatus('processing');
      console.log('Job created:', res.data.jobId);
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = errorData?.error || err.message || 'An error occurred';
      
      // Handle specific error codes
      if (errorData?.code === 'VIDEO_TOO_LONG') {
        errorMessage = `❌ Video is too long!\n\n` +
          `Duration: ${errorData.duration} minutes\n` +
          `Maximum allowed: ${errorData.maxDuration} minutes\n\n` +
          `This is an open-source project with limited OpenAI credits. ` +
          `Please use videos that are ${errorData.maxDuration} minutes or shorter.`;
      } else if (errorData?.code === 'NO_OPENAI_CREDITS') {
        errorMessage = `⚠️ OpenAI API Credits Empty\n\n` +
          `The owner's OpenAI API key credits are empty or expired.\n\n` +
          `Please contact the owner to add credits to their OpenAI account.\n\n` +
          `Details: ${errorData.details || errorData.error}`;
      } else if (errorData?.code === 'INVALID_URL') {
        errorMessage = `❌ Invalid URL\n\n` +
          `Only YouTube URLs are supported.\n\n` +
          `Please provide a valid YouTube video URL.`;
      } else if (errorData?.code === 'YT_DLP_NOT_INSTALLED') {
        errorMessage = `❌ yt-dlp is not installed\n\n` +
          `YouTube URLs need yt-dlp to fetch and download videos.\n\n` +
          `You can:\n` +
          `• Install yt-dlp (see README) to use YouTube links\n` +
          `• Or use "Upload Video" and select a file from your computer instead`;
      } else if (errorData?.code === 'VIDEO_INFO_ERROR') {
        errorMessage = `❌ Could not fetch video information\n\n` +
          `Please check if the YouTube URL is valid and accessible.\n\n` +
          `Error: ${errorData.details || errorMessage}`;
      } else if (errorData?.code === 'FILE_TOO_LARGE') {
        errorMessage = `❌ File too large\n\n` +
          `Maximum file size is 500MB.\n\n` +
          `Please upload a smaller video file.`;
      } else if (errorData?.code === 'MISSING_FILE') {
        errorMessage = `❌ No file selected\n\n` +
          `Please select a video file to upload.`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Format summary text
  const formatSummary = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <div key={index} className="summary-bullet">{trimmed}</div>;
      }
      if (/^\d+[\.\)]/.test(trimmed)) {
        return <div key={index} className="summary-numbered">{trimmed}</div>;
      }
      return <div key={index} className="summary-paragraph">{trimmed}</div>;
    }).filter(Boolean);
  };

  const getStageMessage = (stage) => {
    const stages = {
      'checking_credits': 'Checking API credits...',
      'checking_duration': 'Checking video duration...',
      'downloading': 'Downloading audio...',
      'extracting_audio': 'Extracting audio from video...',
      'transcribing': 'Transcribing audio...',
      'summarizing': 'Summarizing transcript...',
      'completed': 'Completed!'
    };
    return stages[stage] || 'Processing...';
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1 className="title">
            <span className="title-icon">🎬</span>
            Video Summarizer
          </h1>
          <p className="subtitle">Transform any video into a concise summary</p>
        </header>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${inputMode === 'url' ? 'active' : ''}`}
            onClick={() => {
              setInputMode('url');
              setSelectedFile(null);
              setError('');
            }}
            disabled={loading}
          >
            📺 YouTube URL
          </button>
          <button
            className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            onClick={() => {
              setInputMode('file');
              setUrl('');
              setError('');
            }}
            disabled={loading}
          >
            📁 Upload Video
          </button>
        </div>

        <div className="input-section">
          <div className="input-wrapper">
            {inputMode === 'url' ? (
              <input
                type="text"
                placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=...)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="url-input"
                onKeyPress={e => e.key === 'Enter' && !loading && handleSummarize()}
                disabled={loading}
              />
            ) : (
              <div className="file-upload-wrapper">
                <label htmlFor="file-upload" className="file-upload-label">
                  {selectedFile ? (
                    <span className="file-name">📹 {selectedFile.name}</span>
                  ) : (
                    <span className="file-placeholder">Click to select video file (mp4, mov, avi, wmv, webm, ogg)</span>
                  )}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="file-input"
                  disabled={loading}
                />
                {selectedFile && (
                  <button
                    className="clear-file-btn"
                    onClick={() => {
                      setSelectedFile(null);
                      document.getElementById('file-upload').value = '';
                    }}
                    disabled={loading}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
            <button 
              onClick={handleSummarize}
              disabled={loading || (inputMode === 'url' ? !url : !selectedFile)}
              className="summarize-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Summarize
                </>
              )}
            </button>
          </div>
        </div>

        {loading && jobStatus && (
          <div className="loading-section">
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="loading-text">{getStageMessage(jobStatus.stage || 'processing')}</p>
            <p className="loading-progress">{Math.round(progress)}%</p>
            <div className="loading-steps">
              <div className={`step ${(jobStatus.stage === 'checking_credits' || jobStatus.stage === 'checking_duration') ? 'active' : ['downloading', 'transcribing', 'summarizing', 'completed'].includes(jobStatus.stage) ? 'done' : ''}`}>
                <span className="step-icon">🔍</span>
                <span>Validating</span>
              </div>
              <div className={`step ${['downloading', 'extracting_audio'].includes(jobStatus.stage) ? 'active' : ['transcribing', 'summarizing', 'completed'].includes(jobStatus.stage) ? 'done' : ''}`}>
                <span className="step-icon">{inputMode === 'url' ? '⬇️' : '🎵'}</span>
                <span>{inputMode === 'url' ? 'Downloading' : 'Extracting'}</span>
              </div>
              <div className={`step ${jobStatus.stage === 'transcribing' ? 'active' : ['summarizing', 'completed'].includes(jobStatus.stage) ? 'done' : ''}`}>
                <span className="step-icon">🎤</span>
                <span>Transcribing</span>
              </div>
              <div className={`step ${jobStatus.stage === 'summarizing' ? 'active' : jobStatus.stage === 'completed' ? 'done' : ''}`}>
                <span className="step-icon">📝</span>
                <span>Summarizing</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <div style={{ whiteSpace: 'pre-line' }}>{error}</div>
            </div>
          </div>
        )}

        {summary && (
          <div className="result-section">
            <div className="result-card summary-card">
              <div className="card-header">
                <h2 className="card-title">
                  <span className="card-icon">📋</span>
                  Summary
                </h2>
              </div>
              <div className="card-content">
                <div className="summary-content">
                  {formatSummary(summary)}
                </div>
              </div>
            </div>
          </div>
        )}

        {transcript && (
          <div className="result-section">
            <div className="result-card transcript-card">
              <details className="transcript-details">
                <summary className="card-header">
                  <h2 className="card-title">
                    <span className="card-icon">📄</span>
                    Full Transcript
                    <span className="transcript-length">({transcript.length} characters)</span>
                  </h2>
                </summary>
                <div className="card-content">
                  <div className="transcript-content">
                    {transcript.split('\n').map((line, index) => (
                      <p key={index} className="transcript-line">
                        {line.trim() || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}

        {!loading && !summary && !error && (
          <div className="welcome-section">
            <div className="welcome-card">
              <h3>🚀 Get Started</h3>
              <p>Enter a YouTube URL or upload a video file above and click "Summarize" to get started!</p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span>Background Processing</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <span>Accurate Summaries</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <span>Secure & Private</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📁</span>
                  <span>Upload Your Videos</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
