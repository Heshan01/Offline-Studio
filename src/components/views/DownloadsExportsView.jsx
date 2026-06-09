import React, { useState, useEffect } from 'react';
import { Download, FolderOpen, Play, Trash2 } from 'lucide-react';

export default function DownloadsExportsView({ onBack }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    if (window.electronAPI) {
      setLoading(true);
      const optimizedFiles = await window.electronAPI.getOptimizedVideos();
      setFiles(optimizedFiles);
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="home-cosmic-wrapper expanded">
      <div className="home-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Download size={28} className="glow-icon accent-blue" /> Downloads & Exports
          </h1>
          <p>Browse and manage your locally rendered media files.</p>
        </div>
        <button className="holographic-btn" onClick={fetchFiles} style={{ padding: '8px 16px', fontSize: '12px' }}>
          Refresh Library
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading files...</div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <FolderOpen size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <div>Your Optimized_Videos folder is empty.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {files.map((file, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '150px', background: '#000', position: 'relative' }}>
                  {file.name.endsWith('.mp3') ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 242, 254, 0.1)' }}>
                      <Play size={48} style={{ color: '#00f2fe', opacity: 0.5 }} />
                    </div>
                  ) : (
                    <video src={"local-media://" + file.path.replace(/\\/g, '/')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#fff' }}>
                    {formatSize(file.size)}
                  </div>
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }} title={file.name}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {new Date(file.mtime).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="qa-button" onClick={() => window.electronAPI.openOutputFolder(file.path)} style={{ flex: 1, justifyContent: 'center', padding: '6px', fontSize: '11px' }}>
                      <FolderOpen size={12} style={{ marginRight: '6px' }} /> Open Location
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
