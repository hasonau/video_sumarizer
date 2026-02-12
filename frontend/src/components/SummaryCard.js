import React from 'react';

function formatSummary(text) {
  if (!text) return [];
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
}

export function SummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <div className="result-section">
      <div className="result-card summary-card">
        <div className="card-header">
          <h2 className="card-title">
            <span className="card-icon">📋</span>
            Summary
          </h2>
        </div>
        <div className="card-content">
          <div className="summary-content">{formatSummary(summary)}</div>
        </div>
      </div>
    </div>
  );
}
