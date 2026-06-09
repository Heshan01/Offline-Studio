import React from 'react';

export default function StatsDashboard({ stats, ffmpegStatus, formatSize }) {
  return (
    <div className="stats-dashboard">
      {/* FFmpeg Status Badge */}
      <div className="ffmpeg-badge-container">
        <span className="badge-label">Environment Status:</span>
        {ffmpegStatus === 'checking' && (
          <span className="status-badge checking">
            <span className="badge-dot"></span> Checking PATH...
          </span>
        )}
        {ffmpegStatus === 'detected' && (
          <span className="status-badge detected">
            <span className="badge-dot"></span> FFmpeg Active (Local GPU Ready)
          </span>
        )}
        {ffmpegStatus === 'missing' && (
          <span className="status-badge missing">
            <span className="badge-dot"></span> FFmpeg Missing (Setup Required)
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-container">
        <div className="stats-card">
          <span className="stats-icon">🎬</span>
          <div className="stats-info">
            <span className="stats-number">{stats.count || 0}</span>
            <span className="stats-desc">Videos Compressed</span>
          </div>
        </div>

        <div className="stats-card">
          <span className="stats-icon">💾</span>
          <div className="stats-info">
            <span className="stats-number">{formatSize(stats.savedBytes || 0)}</span>
            <span className="stats-desc">Total Disk Saved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
