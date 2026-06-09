import React from 'react';

export default function ProgressPanel({ file, progress, durationStr, timeElapsed, eta }) {
  return (
    <div className="progress-panel">
      <div className="progress-header">
        <span className="progress-title">Compressing Local Storage Stream...</span>
        <span className="progress-percent">{progress}%</span>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="file-details-card" style={{ marginTop: '10px' }}>
        <div className="file-row">
          <span className="file-label">Target File</span>
          <span className="file-value">{file?.name}</span>
        </div>
        {durationStr && (
          <div className="file-row">
            <span className="file-label">Total Duration</span>
            <span className="file-value">{durationStr}</span>
          </div>
        )}
        {timeElapsed && (
          <div className="file-row">
            <span className="file-label">Processed Time</span>
            <span className="file-value" style={{ color: 'var(--text-main)' }}>{timeElapsed}</span>
          </div>
        )}
        {eta && (
          <div className="file-row">
            <span className="file-label">Time Remaining (ETA)</span>
            <span className="file-value" style={{ color: 'var(--accent-cyan)' }}>{eta}</span>
          </div>
        )}
      </div>

      <div className="status-log">
        {progress === 99 ? 'Finalizing file stream container...' : `Direct disk compression active (${progress}%)`}
      </div>
    </div>
  );
}
