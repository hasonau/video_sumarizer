import React from 'react';

export function TranscriptCard({ transcript }) {
  if (!transcript) return null;
  return (
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
  );
}
