import React from 'react';
import { Clock, FolderOpen, CheckCircle } from 'lucide-react';

export default function RecentFilesView({ completedJobs, onBack }) {
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="home-cosmic-wrapper expanded">
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={28} className="glow-icon accent-blue" /> Recent Files
          </h1>
          <p>History of your processed videos in this session.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
        {completedJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Clock size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <div>No recent files processed yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {completedJobs.slice().reverse().map((job, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                    {job.originalFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                    <span>Original: {formatSize(job.originalSize)}</span>
                    <span>→</span>
                    <span style={{ color: '#00f2fe' }}>Output: {formatSize(job.finalSize)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="qa-button" onClick={() => window.electronAPI.openOutputFolder(job.outputPath)} style={{ padding: '8px 12px' }}>
                    <FolderOpen size={14} style={{ marginRight: '6px' }} /> Show in Folder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
