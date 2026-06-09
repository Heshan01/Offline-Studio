import React from 'react';

export default function SettingsPanel({
  mode, setMode,
  crf, setCrf,
  preset, setPreset,
  targetSizeMB, setTargetSizeMB,
  resolution, setResolution,
  gpu, setGpu,
  muteAudio, setMuteAudio,
  container, setContainer,
  videoCodec, setVideoCodec,
  audioCodec, setAudioCodec,
  filterDeinterlace, setFilterDeinterlace,
  filterDenoise, setFilterDenoise,
  filterGrayscale, setFilterGrayscale
}) {
  const getQualityLabel = (val) => {
    if (val <= 19) return "High Quality (Large File)";
    if (val <= 24) return "Balanced Quality";
    return "Fast Compression (Smaller File)";
  };

  return (
    <div className="settings-panel" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
      <h3 className="settings-title">Advanced Compression Settings</h3>

      {/* Format & Codec Section */}
      <div className="settings-grid" style={{ marginBottom: '16px' }}>
        <div className="settings-row">
          <label className="settings-label">Container Format</label>
          <select className="settings-select" value={container} onChange={(e) => setContainer(e.target.value)}>
            <option value="mp4">MP4 (Standard)</option>
            <option value="mkv">MKV (Matroska)</option>
            <option value="webm">WebM (Web Optimized)</option>
          </select>
        </div>
        <div className="settings-row">
          <label className="settings-label">Video Codec</label>
          <select className="settings-select" value={videoCodec} onChange={(e) => setVideoCodec(e.target.value)}>
            <option value="h264">H.264 / AVC (Most Compatible)</option>
            <option value="h265">H.265 / HEVC (Better Compression)</option>
            <option value="av1">AV1 (Next-Gen, High CPU)</option>
          </select>
        </div>
      </div>

      <div className="settings-grid" style={{ marginBottom: '16px' }}>
        <div className="settings-row">
          <label className="settings-label">Audio Codec</label>
          <select className="settings-select" value={audioCodec} onChange={(e) => setAudioCodec(e.target.value)} disabled={muteAudio}>
            <option value="aac">AAC (Standard)</option>
            <option value="mp3">MP3</option>
            <option value="flac">FLAC (Lossless)</option>
            <option value="opus">Opus (Best for WebM)</option>
          </select>
        </div>
        <div className="settings-row">
          <label className="settings-label">Resolution Downscaling</label>
          <select className="settings-select" value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="original">Keep Original (No scale)</option>
            <option value="1080p">Downscale to 1080p (Full HD)</option>
            <option value="720p">Downscale to 720p (HD)</option>
            <option value="480p">Downscale to 480p (SD)</option>
          </select>
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-label">GPU Hardware Encoding</label>
        <select className="settings-select" value={gpu} onChange={(e) => setGpu(e.target.value)}>
          <option value="none">None (CPU - Highly Compatible)</option>
          <option value="nvidia">NVIDIA (NVENC Acceleration)</option>
          <option value="intel">Intel (QSV Acceleration)</option>
          <option value="amd">AMD (AMF Acceleration)</option>
        </select>
      </div>

      <hr className="settings-divider" style={{ margin: '20px 0' }} />

      {/* Mode Switcher Tabs */}
      <div className="settings-tabs" style={{ marginBottom: '16px' }}>
        <button 
          className={`settings-tab ${mode === 'quality' ? 'active' : ''}`}
          onClick={() => setMode('quality')}
          type="button"
        >
          Constant Quality
        </button>
        <button 
          className={`settings-tab ${mode === 'target_size' ? 'active' : ''}`}
          onClick={() => setMode('target_size')}
          type="button"
        >
          Target File Size
        </button>
      </div>

      {/* Dynamic Mode Form Block */}
      <div className="settings-group">
        {mode === 'quality' ? (
          <div>
            <div className="settings-row">
              <label className="settings-label">
                Quality Factor (CRF): <span className="settings-value highlight">{crf}</span>
              </label>
              <input 
                className="quality-slider"
                type="range" min="18" max="28" 
                value={crf} onChange={(e) => setCrf(parseInt(e.target.value))}
              />
              <div className="slider-descriptors">
                <span>High (18)</span>
                <span className="desc-active">{getQualityLabel(crf)}</span>
                <span>Low (28)</span>
              </div>
            </div>
            
            <div className="settings-row" style={{ marginTop: '15px' }}>
              <label className="settings-label">Compression Speed Preset</label>
              <select className="settings-select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                <option value="ultrafast">Ultrafast</option>
                <option value="superfast">Superfast</option>
                <option value="veryfast">Veryfast</option>
                <option value="faster">Faster</option>
                <option value="fast">Fast (Recommended balanced)</option>
                <option value="medium">Medium</option>
                <option value="slow">Slow</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <div className="settings-row">
              <label className="settings-label">Target File Size (Megabytes)</label>
              <div className="target-input-row">
                <input 
                  className="settings-input"
                  type="number" min="1" max="5000" 
                  value={targetSizeMB} onChange={(e) => setTargetSizeMB(parseFloat(e.target.value) || '')}
                />
                <span className="input-suffix">MB</span>
              </div>

              {/* Quick Size Preset Chips */}
              <div className="preset-chips">
                <button className={`chip-button ${targetSizeMB === 25 ? 'selected' : ''}`} onClick={() => setTargetSizeMB(25)} type="button">25 MB</button>
                <button className={`chip-button ${targetSizeMB === 50 ? 'selected' : ''}`} onClick={() => setTargetSizeMB(50)} type="button">50 MB</button>
                <button className={`chip-button ${targetSizeMB === 100 ? 'selected' : ''}`} onClick={() => setTargetSizeMB(100)} type="button">100 MB</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="settings-divider" style={{ margin: '20px 0' }} />

      <h3 className="settings-title" style={{ marginBottom: '12px' }}>Video Filters & Audio</h3>
      
      <div className="settings-grid">
        <div className="settings-row toggle-row">
          <div className="toggle-label-container">
            <span className="settings-label">Deinterlace</span>
            <span className="settings-sublabel">Fix comb lines</span>
          </div>
          <label className="switch-container">
            <input type="checkbox" checked={filterDeinterlace} onChange={(e) => setFilterDeinterlace(e.target.checked)} />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-row toggle-row">
          <div className="toggle-label-container">
            <span className="settings-label">Denoise</span>
            <span className="settings-sublabel">Smooth grain</span>
          </div>
          <label className="switch-container">
            <input type="checkbox" checked={filterDenoise} onChange={(e) => setFilterDenoise(e.target.checked)} />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-row toggle-row">
          <div className="toggle-label-container">
            <span className="settings-label">Grayscale</span>
            <span className="settings-sublabel">Black & White</span>
          </div>
          <label className="switch-container">
            <input type="checkbox" checked={filterGrayscale} onChange={(e) => setFilterGrayscale(e.target.checked)} />
            <span className="switch-slider"></span>
          </label>
        </div>

        <div className="settings-row toggle-row">
          <div className="toggle-label-container">
            <span className="settings-label">Mute Audio</span>
            <span className="settings-sublabel">Strip audio track</span>
          </div>
          <label className="switch-container">
            <input type="checkbox" checked={muteAudio} onChange={(e) => setMuteAudio(e.target.checked)} />
            <span className="switch-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}
