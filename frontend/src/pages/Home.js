import { useState, useEffect } from 'react';
import {
  Header,
  ModeToggle,
  InputSection,
  LoadingSection,
  ErrorBox,
  SummaryCard,
  TranscriptCard,
  WelcomeSection
} from '../components';
import { api } from '../services/api';

function getErrorMessage(err) {
  const errorData = err.response?.data;
  let msg = errorData?.error || err.message || 'An error occurred';
  if (errorData?.code === 'VIDEO_TOO_LONG') {
    msg = `❌ Video is too long!\n\nDuration: ${errorData.duration} minutes\nMaximum allowed: ${errorData.maxDuration} minutes\n\nThis is an open-source project with limited OpenAI credits. Please use videos that are ${errorData.maxDuration} minutes or shorter.`;
  // } else if (errorData?.code === 'NO_OPENAI_CREDITS') {
  //   msg = `⚠️ OpenAI API Credits Empty\n\nThe owner's OpenAI API key credits are empty or expired.\n\nPlease contact the owner to add credits.\n\nDetails: ${errorData.details || errorData.error}`;
  } else if (errorData?.code === 'MISSING_URL') {
    msg = 'Please enter a YouTube URL.';
  } else if (errorData?.code === 'INVALID_URL') {
    msg = `❌ Invalid URL\n\nOnly YouTube URLs are supported. Please provide a valid YouTube video URL.`;
  } else if (errorData?.code === 'YT_DLP_NOT_INSTALLED') {
    msg = `❌ yt-dlp is not installed\n\nYouTube URLs need yt-dlp. Install it (see README) or use "Upload Video" instead.`;
  } else if (errorData?.code === 'VIDEO_INFO_ERROR') {
    msg = `❌ Could not fetch video information\n\nCheck if the URL is valid.\n\nError: ${errorData.details || msg}`;
  } else if (errorData?.code === 'FILE_TOO_LARGE') {
    msg = `❌ File too large\n\nMaximum file size is 500MB.`;
  } else if (errorData?.code === 'MISSING_FILE') {
    msg = `❌ No file selected\n\nPlease select a video file to upload.`;
  } else if (!err.response) {
    msg = `Cannot reach the backend.\n\n• Is the backend running? (e.g. \`cd backend && npm start\`)\n• If frontend and backend are on different hosts, set REACT_APP_API_URL to your backend URL.\n\n${err.message || 'Network error'}`;
  }
  return msg;
}

const VALID_VIDEO_TYPES = [
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
  'video/x-ms-wmv', 'video/webm', 'video/ogg'
];
const MAX_FILE_SIZE = 500 * 1024 * 1024;

export default function Home() {
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [inputMode, setInputMode] = useState('url');
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    api.checkHealth()
      .then(res => {
        setApiStatus(res.data?.success && (res.data?.message || '').toLowerCase().includes('running') ? 'running' : 'error');
      })
      .catch(() => setApiStatus('error'));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getJobStatus(jobId);
        const status = res.data.status;
        const progressData = res.data.progress ?? 0;
        const stage = res.data.stage || 'processing';
        const progressPercent = typeof progressData === 'number' ? progressData : (progressData.progress ?? 0);
        setProgress(progressPercent);
        setJobStatus({ status, stage });

        if (status === 'completed') {
          setSummary(res.data.summary ?? '');
          setTranscript(res.data.transcript ?? '');
          setLoading(false);
          clearInterval(interval);
        } else if (status === 'failed') {
          setError(res.data.error || 'Job failed');
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Job not found. It may have expired or been deleted.');
          setLoading(false);
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!VALID_VIDEO_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload a video file (mp4, mov, avi, wmv, webm, ogg).');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum file size is 500MB.');
      return;
    }
    setSelectedFile(file);
    setError('');
    setUrl('');
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    const el = document.getElementById('file-upload');
    if (el) el.value = '';
  };

  const handleSummarize = async () => {
    const urlToUse = typeof url === 'string' ? url.trim() : '';
    if (inputMode === 'url' && !urlToUse) {
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
        const formData = new FormData();
        formData.append('video', selectedFile);
        res = await api.createUploadJob(formData);
      } else {
        res = await api.createSummarizeJob(urlToUse);
      }
      const jobIdFromApi = res?.data?.jobId;
      if (!jobIdFromApi) {
        setError('Backend did not return a job ID. Check server logs.');
        setLoading(false);
        return;
      }
      setJobId(jobIdFromApi);
      setJobStatus({ status: 'processing', stage: 'processing' });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSummarize();
    }
  };

  return (
    <>
      <Header />
      <ModeToggle
        inputMode={inputMode}
        loading={loading}
        onSelectUrl={() => { setInputMode('url'); setSelectedFile(null); setError(''); }}
        onSelectFile={() => { setInputMode('file'); setUrl(''); setError(''); }}
      />
      <InputSection
        inputMode={inputMode}
        url={url}
        setUrl={setUrl}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onClearFile={handleClearFile}
        loading={loading}
        onSummarize={handleSummarize}
        onKeyDown={handleKeyDown}
      />

      {loading && jobStatus && (
        <LoadingSection
          jobStatus={jobStatus}
          progress={progress}
          inputMode={inputMode}
        />
      )}

      <ErrorBox message={error} />
      <SummaryCard summary={summary} />
      <TranscriptCard transcript={transcript} />

      {!loading && !summary && !error && (
        <WelcomeSection apiStatus={apiStatus} />
      )}
    </>
  );
}
