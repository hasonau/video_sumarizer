import React from 'react';

export function WelcomeSection({ apiStatus }) {
  return (
    <div className="welcome-section">
      <div className="welcome-card">
        {apiStatus === 'running' && (
          <div className="api-status-banner">✅ All APIs are running</div>
        )}
        {apiStatus === 'error' && (
          <div className="api-status-banner error">
            ⚠️ Cannot reach backend. Check REACT_APP_API_URL or ensure backend is deployed.
          </div>
        )}
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
  );
}
