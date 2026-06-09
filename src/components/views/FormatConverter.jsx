import React, { useState, useEffect } from 'react';
import DropZone from '../DropZone';
import FileDetails from '../FileDetails';
import { RefreshCw } from 'lucide-react';

export default function FormatConverter({ onBack, defaultFormat = 'mp4' }) {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState(defaultFormat);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!window.electronAPI) return;
    const removeComplete = window.electronAPI.onCompressionCompleted(() => {
      setStatus('ready');
    });
    const removeError = window.electronAPI.onCompressionError(() => {
      setStatus('ready');
    });
    return () => {
      removeComplete();
      removeError();
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile({
        path: e.dataTransfer.files[0].path,
        name: e.dataTransfer.files[0].name,
        size: e.dataTransfer.files[0].size
      });
      setStatus('ready');
    }
  };

  const handleSelectFile = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectFile();
      if (selected) {
        setFile(selected);
        setStatus('ready');
      }
    }
  };

  const handleStart = () => {
    if (!file) return;
    setStatus('compressing');
    
    let actionType = 'convert';
    if (format === 'gif') actionType = 'gif';
    if (format === 'mp3') actionType = 'extract_audio';

    const config = {
      action: actionType,
      container: format,
      videoCodec: 'h264',
      audioCodec: format === 'mp3' ? 'mp3' : 'aac',
      preset: 'fast'
    };
    
    if (window.electronAPI) {
       window.electronAPI.startCompression(file.path, config);
    }
  };

  return (
    <div className={`home-cosmic-wrapper ${file ? 'expanded' : ''}`}>
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={28} className="glow-icon accent-blue" /> Format Converter
          </h1>
          <p>Quickly transmux or convert video container formats without re-encoding.</p>
        </div>
      </div>

      {!file ? (
        <DropZone dragActive={false} onDrag={(e)=>e.preventDefault()} onDrop={handleDrop} onClick={handleSelectFile} />
      ) : (
        <div className="dashboard-layout dual-pane">
          <div className="left-pane glass-panel">
            <div className="video-preview-container">
              <video 
                key={file.path}
                src={"local-media://" + file.path.replace(/\\/g, '/')}
                controls
                className="video-preview-element"
              />
            </div>
            <div className="file-details-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <FileDetails file={file} formatSize={(b) => (b/1048576).toFixed(2) + ' MB'} />
            </div>
          </div>

          <div className="right-pane glass-panel">
            <div className="converter-settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-row">
                <label className="settings-label" style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Output Format</label>
                <select className="settings-select" value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}>
                  <option value="mp4">MP4 Video</option>
                  <option value="mkv">MKV Video</option>
                  <option value="webm">WebM Video</option>
                  <option value="gif">Animated GIF</option>
                  <option value="mp3">MP3 Audio (Extract)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '40px' }}>
              {status === 'ready' && (
                <button className="holographic-btn" onClick={handleStart} style={{ width: '100%', justifyContent: 'center' }}>
                  <RefreshCw size={16} /> Convert to .{format.toUpperCase()}
                </button>
              )}

              {status === 'compressing' && (
                <div className="status-log" style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00f2fe', color: '#00f2fe', padding: '12px', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}>
                  Conversion sent to background queue. Check Status area!
                </div>
              )}

              <button className="qa-button" onClick={() => { setFile(null); setStatus('idle'); }} style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                Choose Different File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
