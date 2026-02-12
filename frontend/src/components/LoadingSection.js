import React from 'react';

const STAGE_MESSAGES = {
  checking_credits: 'Checking API credits...',
  checking_duration: 'Checking video duration...',
  downloading: 'Downloading audio...',
  extracting_audio: 'Extracting audio from video...',
  transcribing: 'Transcribing audio...',
  summarizing: 'Summarizing transcript...',
  completed: 'Completed!'
};

export function LoadingSection({ jobStatus, progress, inputMode }) {
  const stage = jobStatus?.stage || 'processing';
  const message = STAGE_MESSAGES[stage] || 'Processing...';

  return (
    <div className="loading-section">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="loading-text">{message}</p>
      <p className="loading-progress">{Math.round(progress)}%</p>
      <div className="loading-steps">
        <div className={`step ${['checking_credits', 'checking_duration'].includes(stage) ? 'active' : ['downloading', 'transcribing', 'summarizing', 'completed'].includes(stage) ? 'done' : ''}`}>
          <span className="step-icon">🔍</span>
          <span>Validating</span>
        </div>
        <div className={`step ${['downloading', 'extracting_audio'].includes(stage) ? 'active' : ['transcribing', 'summarizing', 'completed'].includes(stage) ? 'done' : ''}`}>
          <span className="step-icon">{inputMode === 'url' ? '⬇️' : '🎵'}</span>
          <span>{inputMode === 'url' ? 'Downloading' : 'Extracting'}</span>
        </div>
        <div className={`step ${stage === 'transcribing' ? 'active' : ['summarizing', 'completed'].includes(stage) ? 'done' : ''}`}>
          <span className="step-icon">🎤</span>
          <span>Transcribing</span>
        </div>
        <div className={`step ${stage === 'summarizing' ? 'active' : stage === 'completed' ? 'done' : ''}`}>
          <span className="step-icon">📝</span>
          <span>Summarizing</span>
        </div>
      </div>
    </div>
  );
}
