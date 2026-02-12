import React from 'react';

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="error-box">
      <span className="error-icon">⚠️</span>
      <div className="error-content">
        <div style={{ whiteSpace: 'pre-line' }}>{message}</div>
      </div>
    </div>
  );
}
