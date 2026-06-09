import React, { useState, useRef, useEffect } from 'react';
import DropZone from '../DropZone';
import FileDetails from '../FileDetails';
import { Maximize, Crop, Play } from 'lucide-react';

export default function VideoEditor({ onBack }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  
  // Resize & Crop States
  const [videoMeta, setVideoMeta] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [scaleMode, setScaleMode] = useState('original');
  const [padVideo, setPadVideo] = useState(false);

  // Dragging logic
  const previewRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(''); // 'move', 'nw', 'ne', 'sw', 'se'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState(null);

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

  const startDrag = (e, type) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...crop });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!previewRef.current || !initialCrop) return;
      const rect = previewRef.current.getBoundingClientRect();
      const dxPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
      const dyPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

      let newCrop = { ...initialCrop };

      if (dragType === 'move') {
        newCrop.x = Math.max(0, Math.min(100 - newCrop.w, initialCrop.x + dxPercent));
        newCrop.y = Math.max(0, Math.min(100 - newCrop.h, initialCrop.y + dyPercent));
      } else if (dragType === 'nw') {
        const nx = Math.min(initialCrop.x + initialCrop.w - 5, Math.max(0, initialCrop.x + dxPercent));
        const ny = Math.min(initialCrop.y + initialCrop.h - 5, Math.max(0, initialCrop.y + dyPercent));
        newCrop.w = initialCrop.w + (initialCrop.x - nx);
        newCrop.h = initialCrop.h + (initialCrop.y - ny);
        newCrop.x = nx;
        newCrop.y = ny;
      } else if (dragType === 'ne') {
        const ny = Math.min(initialCrop.y + initialCrop.h - 5, Math.max(0, initialCrop.y + dyPercent));
        const nw = Math.max(5, Math.min(100 - initialCrop.x, initialCrop.w + dxPercent));
        newCrop.h = initialCrop.h + (initialCrop.y - ny);
        newCrop.y = ny;
        newCrop.w = nw;
      } else if (dragType === 'sw') {
        const nx = Math.min(initialCrop.x + initialCrop.w - 5, Math.max(0, initialCrop.x + dxPercent));
        const nh = Math.max(5, Math.min(100 - initialCrop.y, initialCrop.h + dyPercent));
        newCrop.w = initialCrop.w + (initialCrop.x - nx);
        newCrop.x = nx;
        newCrop.h = nh;
      } else if (dragType === 'se') {
        newCrop.w = Math.max(5, Math.min(100 - initialCrop.x, initialCrop.w + dxPercent));
        newCrop.h = Math.max(5, Math.min(100 - initialCrop.y, initialCrop.h + dyPercent));
      }

      window.requestAnimationFrame(() => {
        setCrop(newCrop);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType('');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, dragStart, initialCrop]);

  const handleStartProcess = () => {
    if (!file) return;
    setStatus('compressing');
    
    // Calculate precise crop pixels
    let cropStr = null;
    if (crop.w < 100 || crop.h < 100 || crop.x > 0 || crop.y > 0) {
      const cw = Math.floor(videoMeta.w * (crop.w / 100));
      const ch = Math.floor(videoMeta.h * (crop.h / 100));
      const cx = Math.floor(videoMeta.w * (crop.x / 100));
      const cy = Math.floor(videoMeta.h * (crop.y / 100));
      cropStr = `${cw}:${ch}:${cx}:${cy}`;
    }

    // Calculate scaling
    let scaleStr = null;
    if (scaleMode === '1080p') scaleStr = "1920:1080";
    else if (scaleMode === '720p') scaleStr = "1280:720";
    else if (scaleMode === '480p') scaleStr = "854:480";
    
    // Calculate padding
    let padStr = null;
    if (padVideo && scaleMode !== 'original') {
      const s = scaleStr.split(':');
      padStr = `${s[0]}:${s[1]}:(ow-iw)/2:(oh-ih)/2:black`;
      scaleStr = `min(${s[0]},iw):min(${s[1]},ih)`; 
    }

    const config = {
      action: 'edit',
      crop: cropStr,
      scale: scaleStr,
      pad: padStr
    };
    
    if (window.electronAPI) {
       window.electronAPI.startCompression(file.path, config);
    }
  };

  const handleDragBoxInteraction = (e) => {
    // If we click directly on the preview background (not the crop box), start drawing a new box
    if (!isDragging) {
      const rect = previewRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      setCrop({ x: xPercent, y: yPercent, w: 10, h: 10 });
      startDrag(e, 'se'); // Immediately start resizing the bottom right
    }
  };

  return (
    <div className={`home-cosmic-wrapper ${file ? 'expanded' : ''}`}>
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Maximize size={28} className="glow-icon accent-blue" /> Advanced Video Resizer
          </h1>
          <p>Visually crop, pad, and scale your video to exact dimensions.</p>
        </div>
      </div>

      {!file ? (
        <DropZone dragActive={false} onDrag={(e)=>e.preventDefault()} onDrop={handleDrop} onClick={handleSelectFile} />
      ) : (
        <div className="dashboard-layout dual-pane">
          <div className="left-pane glass-panel" style={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
            <div 
              className="video-preview-container" 
              ref={previewRef}
              style={{ 
                position: 'relative', 
                background: '#000', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                cursor: 'crosshair', 
                userSelect: 'none',
                width: '100%',
                maxHeight: '500px',
                aspectRatio: videoMeta.w && videoMeta.h ? videoMeta.w / videoMeta.h : 16/9,
                margin: '0 auto'
              }}
              onMouseDown={handleDragBoxInteraction}
            >
              <video 
                key={file.path}
                src={"local-media://" + file.path.replace(/\\/g, '/')}
                controls
                className="video-preview-element"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: isDragging ? 'none' : 'auto' }}
                onLoadedMetadata={(e) => setVideoMeta({ w: e.target.videoWidth, h: e.target.videoHeight })}
              />
              
              {/* Interactive Crop Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: `${crop.y}%`, left: `${crop.x}%`, width: `${crop.w}%`, height: `${crop.h}%`,
                  border: '2px solid #00f2fe',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                  cursor: 'move',
                  zIndex: 10,
                  display: (crop.w === 100 && crop.h === 100 && crop.x === 0 && crop.y === 0) ? 'none' : 'block'
                }}
                onMouseDown={(e) => startDrag(e, 'move')}
              >
                <div style={{ position: 'absolute', top: -6, left: -6, width: 12, height: 12, background: '#00f2fe', borderRadius: '50%', cursor: 'nwse-resize' }} onMouseDown={(e) => startDrag(e, 'nw')}></div>
                <div style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, background: '#00f2fe', borderRadius: '50%', cursor: 'nesw-resize' }} onMouseDown={(e) => startDrag(e, 'ne')}></div>
                <div style={{ position: 'absolute', bottom: -6, left: -6, width: 12, height: 12, background: '#00f2fe', borderRadius: '50%', cursor: 'nesw-resize' }} onMouseDown={(e) => startDrag(e, 'sw')}></div>
                <div style={{ position: 'absolute', bottom: -6, right: -6, width: 12, height: 12, background: '#00f2fe', borderRadius: '50%', cursor: 'nwse-resize' }} onMouseDown={(e) => startDrag(e, 'se')}></div>
              </div>
            </div>
            
            <div className="file-details-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', marginTop: '16px' }}>
              <FileDetails file={file} formatSize={(b) => (b/1048576).toFixed(2) + ' MB'} />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                Resolution: {videoMeta.w}x{videoMeta.h}
              </div>
            </div>
          </div>

          <div className="right-pane glass-panel">
            <div className="editor-settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crop size={16} /> Crop Dimensions (Click & Drag Video)
              </h3>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="settings-row" style={{ flex: 1 }}>
                  <label className="settings-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Width (%)</label>
                  <input type="number" min="1" max="100" value={Math.round(crop.w)} onChange={(e) => setCrop({...crop, w: parseFloat(e.target.value)})} style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
                <div className="settings-row" style={{ flex: 1 }}>
                  <label className="settings-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Height (%)</label>
                  <input type="number" min="1" max="100" value={Math.round(crop.h)} onChange={(e) => setCrop({...crop, h: parseFloat(e.target.value)})} style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="qa-button" onClick={() => setCrop({ x: 0, y: 0, w: 100, h: 100 })} style={{ flex: 1, padding: '6px 12px', fontSize: '11px', justifyContent: 'center' }}>
                  Reset Crop
                </button>
                <button className="qa-button" onClick={() => setCrop({ x: 25, y: 25, w: 50, h: 50 })} style={{ flex: 1, padding: '6px 12px', fontSize: '11px', justifyContent: 'center' }}>
                  Center 50%
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />

              <h3 style={{ fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Maximize size={16} /> Scale & Padding
              </h3>

              <div className="settings-row">
                <label className="settings-label" style={{ fontSize: '12px' }}>Final Resolution</label>
                <select value={scaleMode} onChange={e => setScaleMode(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}>
                  <option value="original">Match Cropped Size</option>
                  <option value="1080p">1920x1080 (1080p)</option>
                  <option value="720p">1280x720 (720p)</option>
                  <option value="480p">854x480 (480p)</option>
                </select>
              </div>

              {scaleMode !== 'original' && (
                <div className="settings-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
                  <input type="checkbox" id="padCheckbox" checked={padVideo} onChange={(e) => setPadVideo(e.target.checked)} />
                  <label htmlFor="padCheckbox" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Add black padding to fit exactly
                  </label>
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '30px' }}>
              {status === 'ready' && (
                <button className="holographic-btn" onClick={handleStartProcess} style={{ width: '100%', justifyContent: 'center' }}>
                  <Play size={16} fill="currentColor" /> Apply Resizing
                </button>
              )}

              {status === 'compressing' && (
                <div className="status-log" style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00f2fe', color: '#00f2fe', padding: '12px', borderRadius: '4px', fontSize: '11px', textAlign: 'center' }}>
                  Processing advanced filters...
                </div>
              )}

              <button className="qa-button" onClick={() => { setFile(null); setStatus('idle'); }} style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                Choose Different Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
