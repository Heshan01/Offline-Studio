import React, { useState, useEffect } from 'react';
import DropZone from '../DropZone';
import FileDetails from '../FileDetails';
import { FileText, Play } from 'lucide-react';

export default function SubtitleEditor({ onBack }) {
  const [videoFile, setVideoFile] = useState(null);
  const [subFile, setSubFile] = useState(null);
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

  // Subtitle styling state
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#ffffff');

  const handleVideoDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setVideoFile({
        path: e.dataTransfer.files[0].path,
        name: e.dataTransfer.files[0].name,
        size: e.dataTransfer.files[0].size
      });
      setStatus('ready');
    }
  };

  const handleSubDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSubFile({
        path: e.dataTransfer.files[0].path,
        name: e.dataTransfer.files[0].name,
        size: e.dataTransfer.files[0].size
      });
    }
  };

  const handleSelectVideo = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectFile();
      if (selected) {
        setVideoFile(selected);
        setStatus('ready');
      }
    }
  };

  const handleSelectSub = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectFile();
      if (selected) {
        setSubFile(selected);
      }
    }
  };

  // Convert hex #RRGGBB to ASS color format &H00BBGGRR
  const hexToAssColor = (hex) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return '&H00FFFFFF';
    const r = cleanHex.substring(0, 2);
    const g = cleanHex.substring(2, 4);
    const b = cleanHex.substring(4, 6);
    return `&H00${b}${g}${r}`;
  };

  const handleStart = () => {
    if (!videoFile || !subFile) return;
    setStatus('compressing');
    
    const assColor = hexToAssColor(fontColor);
    const forceStyle = `FontName=${fontFamily},FontSize=${fontSize},PrimaryColour=${assColor}`;

    const config = {
      action: 'edit',
      container: 'mp4',
      videoCodec: 'h264',
      subtitle: subFile.path,
      subtitleStyle: forceStyle
    };
    
    if (window.electronAPI) {
       window.electronAPI.startCompression(videoFile.path, config);
    }
  };

  return (
    <div className={`home-cosmic-wrapper ${videoFile ? 'expanded' : ''}`}>
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={28} className="glow-icon accent-blue" /> Subtitles Hardcoder
          </h1>
          <p>Permanently burn-in .srt or .vtt subtitles into your videos with custom styling.</p>
        </div>
      </div>

      {!videoFile ? (
        <DropZone dragActive={false} onDrag={(e)=>e.preventDefault()} onDrop={handleVideoDrop} onClick={handleSelectVideo} />
      ) : (
        <div className="dashboard-layout dual-pane">
          <div className="left-pane glass-panel">
            <div className="video-preview-container">
              <video 
                key={videoFile.path}
                src={"local-media://" + videoFile.path.replace(/\\/g, '/')}
                controls
                className="video-preview-element"
                style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
            <div className="file-details-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', marginTop: '16px' }}>
              <FileDetails file={videoFile} formatSize={(b) => (b/1048576).toFixed(2) + ' MB'} />
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '10px' }}>Subtitle Track</h3>
              {!subFile ? (
                <div 
                  onClick={handleSelectSub}
                  onDrop={handleSubDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{ 
                    border: '2px dashed rgba(255,255,255,0.2)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '24px', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.2)'
                  }}
                >
                  <FileText size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Drag & Drop .srt or .vtt file here</div>
                </div>
              ) : (
                <div style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00f2fe', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} /> {subFile.name}
                  </div>
                  <button onClick={() => setSubFile(null)} style={{ background: 'none', border: 'none', color: '#00f2fe', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}>Change</button>
                </div>
              )}
            </div>
          </div>

          <div className="right-pane glass-panel">
            <div className="editor-settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Subtitle Styling
              </h3>

              <div className="settings-row">
                <label className="settings-label" style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Font Family</label>
                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}>
                  <option value="Arial">Arial</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Consolas">Consolas (Monospace)</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Impact">Impact</option>
                </select>
              </div>

              <div className="settings-row">
                <label className="settings-label" style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Font Size</span>
                  <span>{fontSize}px</span>
                </label>
                <input type="range" min="12" max="72" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div className="settings-row">
                <label className="settings-label" style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Primary Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-main)', fontFamily: 'monospace' }}>{fontColor.toUpperCase()}</span>
                </div>
              </div>
              
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', marginTop: '8px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  <strong>Note:</strong> Hardcoding subtitles is a CPU-intensive process because it requires full re-encoding of the video stream. This will take longer than a simple format conversion.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '30px' }}>
              {status === 'ready' && (
                <button 
                  className="holographic-btn" 
                  onClick={handleStart} 
                  disabled={!subFile}
                  style={{ width: '100%', justifyContent: 'center', opacity: !subFile ? 0.5 : 1 }}
                >
                  <Play size={16} fill="currentColor" /> Burn Subtitles
                </button>
              )}

              {status === 'compressing' && (
                <div className="status-log" style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00f2fe', color: '#00f2fe', padding: '12px', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}>
                  Encoding hardcoded subtitles in background...
                </div>
              )}

              <button className="qa-button" onClick={() => { setVideoFile(null); setSubFile(null); setStatus('idle'); }} style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                Choose Different Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
