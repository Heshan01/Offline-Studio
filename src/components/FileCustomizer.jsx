import React, { useState } from 'react';

export default function FileCustomizer({
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
  const [activeTab, setActiveTab] = useState('video'); // video, audio, filters

  const getQualityLabel = (val) => {
    if (val <= 19) return "High Quality (Large)";
    if (val <= 25) return "Balanced";
    if (val <= 35) return "Low Quality (Small)";
    return "Ultra Compress (Tiny)";
  };

  return (
    <div className="file-customizer">
      <div className="customizer-tabs">
        <button 
          className={`customizer-tab ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          🎬 Video & Format
        </button>
        <button 
          className={`customizer-tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          🎵 Audio
        </button>
        <button 
          className={`customizer-tab ${activeTab === 'filters' ? 'active' : ''}`}
          onClick={() => setActiveTab('filters')}
        >
          ✨ Filters
        </button>
      </div>

      <div className="customizer-content">
        {activeTab === 'video' && (
          <div className="customizer-panel-section fade-in">
            <div className="settings-grid">
              <div className="settings-row">
                <label className="settings-label">Format</label>
                <select className="settings-select" value={container} onChange={(e) => setContainer(e.target.value)}>
                  <option value="mp4">MP4</option>
                  <option value="mkv">MKV</option>
                  <option value="webm">WebM</option>
                </select>
              </div>
              <div className="settings-row">
                <label className="settings-label">Video Codec</label>
                <select className="settings-select" value={videoCodec} onChange={(e) => setVideoCodec(e.target.value)}>
                  <option value="h264">H.264 (Compatible)</option>
                  <option value="h265">H.265 (HEVC)</option>
                  <option value="av1">AV1 (Next-Gen)</option>
                </select>
              </div>
            </div>

            <div className="settings-grid">
              <div className="settings-row">
                <label className="settings-label">Resolution</label>
                <select className="settings-select" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                  <option value="original">Original</option>
                  <option value="1080p">1080p FHD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                </select>
              </div>
              <div className="settings-row">
                <label className="settings-label">Hardware Acceleration</label>
                <select className="settings-select" value={gpu} onChange={(e) => setGpu(e.target.value)}>
                  <option value="none">None (CPU)</option>
                  <option value="nvidia">NVIDIA (NVENC)</option>
                  <option value="intel">Intel (QSV)</option>
                  <option value="amd">AMD (AMF)</option>
                </select>
              </div>
            </div>

            <hr className="settings-divider" />

            <div className="settings-tabs" style={{ marginBottom: '12px' }}>
              <button 
                className={`settings-tab ${mode === 'quality' ? 'active' : ''}`}
                onClick={() => setMode('quality')}
              >
                Constant Quality
              </button>
              <button 
                className={`settings-tab ${mode === 'target_size' ? 'active' : ''}`}
                onClick={() => setMode('target_size')}
              >
                Target File Size
              </button>
            </div>

            {mode === 'quality' ? (
              <div className="settings-group fade-in">
                <div className="settings-row">
                  <label className="settings-label">
                    CRF Level: <span className="settings-value highlight">{crf}</span>
                  </label>
                  <input 
                    className="quality-slider"
                    type="range" min="18" max="51" 
                    value={crf} onChange={(e) => setCrf(parseInt(e.target.value))}
                  />
                  <div className="slider-descriptors">
                    <span>High (18)</span>
                    <span className="desc-active">{getQualityLabel(crf)}</span>
                    <span>Ultra Low (51)</span>
                  </div>
                </div>
                <div className="settings-row" style={{ marginTop: '12px' }}>
                  <label className="settings-label">Preset Speed</label>
                  <select className="settings-select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                    <option value="ultrafast">Ultrafast</option>
                    <option value="fast">Fast (Recommended)</option>
                    <option value="slow">Slow</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="settings-group fade-in">
                <div className="settings-row">
                  <label className="settings-label">Target MB</label>
                  <div className="target-input-row">
                    <input 
                      className="settings-input"
                      type="number" min="1" max="5000" 
                      value={targetSizeMB} onChange={(e) => setTargetSizeMB(parseFloat(e.target.value) || '')}
                    />
                    <span className="input-suffix">MB</span>
                  </div>
                  <div className="preset-chips">
                    <button className={`chip-button ${targetSizeMB === 25 ? 'selected' : ''}`} onClick={() => setTargetSizeMB(25)}>25 MB</button>
                    <button className={`chip-button ${targetSizeMB === 50 ? 'selected' : ''}`} onClick={() => setTargetSizeMB(50)}>50 MB</button>
                    <button className={`chip-button ${targetSizeMB === 100 ? 'selected' : ''}`} onClick={() => setTargetSizeMB(100)}>100 MB</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="customizer-panel-section fade-in">
            <div className="settings-row toggle-row" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
              <div className="toggle-label-container">
                <span className="settings-label">Mute Output</span>
                <span className="settings-sublabel">Completely strip the audio track</span>
              </div>
              <label className="switch-container">
                <input type="checkbox" checked={muteAudio} onChange={(e) => setMuteAudio(e.target.checked)} />
                <span className="switch-slider"></span>
              </label>
            </div>
            
            <div className="settings-row">
              <label className="settings-label">Audio Codec</label>
              <select className="settings-select" value={audioCodec} onChange={(e) => setAudioCodec(e.target.value)} disabled={muteAudio}>
                <option value="aac">AAC (Standard)</option>
                <option value="mp3">MP3</option>
                <option value="flac">FLAC (Lossless)</option>
                <option value="opus">Opus (WebM)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="customizer-panel-section fade-in">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
