import React from 'react';

export function InputSection({
  inputMode,
  url,
  setUrl,
  selectedFile,
  onFileSelect,
  onClearFile,
  loading,
  onSummarize,
  onKeyDown
}) {
  const canSubmit = inputMode === 'url' ? url.trim() : selectedFile;
  return (
    <div className="input-section">
      <div className="input-wrapper">
        {inputMode === 'url' ? (
          <input
            type="text"
            placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=...)"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="url-input"
            onKeyDown={onKeyDown}
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
              onChange={onFileSelect}
              className="file-input"
              disabled={loading}
            />
            {selectedFile && (
              <button
                type="button"
                className="clear-file-btn"
                onClick={onClearFile}
                disabled={loading}
              >
                ✕
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onSummarize}
          disabled={loading || !canSubmit}
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
  );
}
