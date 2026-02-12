import React from 'react';

export function ModeToggle({ inputMode, loading, onSelectUrl, onSelectFile }) {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-btn ${inputMode === 'url' ? 'active' : ''}`}
        onClick={onSelectUrl}
        disabled={loading}
      >
        📺 YouTube URL
      </button>
      <button
        className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
        onClick={onSelectFile}
        disabled={loading}
      >
        📁 Upload Video
      </button>
    </div>
  );
}
