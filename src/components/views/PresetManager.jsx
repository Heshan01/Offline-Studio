import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function PresetManager({ onApplyPreset }) {
  const defaultPresets = [
    {
      id: 'p1',
      name: 'Web Friendly (Fast)',
      description: 'H264, 720p, CRF 28, Fast preset. Great for Discord or Email.',
      data: { container: 'mp4', videoCodec: 'h264', resolution: '1280x720', crf: 28, preset: 'fast', mode: 'quality' }
    },
    {
      id: 'p2',
      name: 'High Quality Archival',
      description: 'H265, Original Resolution, CRF 18, Slow preset. Visually lossless.',
      data: { container: 'mkv', videoCodec: 'h265', resolution: 'original', crf: 18, preset: 'slow', mode: 'quality' }
    },
    {
      id: 'p3',
      name: 'Mobile Target (10MB)',
      description: 'Compress to exactly 10MB using 2-pass encoding.',
      data: { mode: 'target_size', targetSizeMB: 10, container: 'mp4', videoCodec: 'h264', resolution: '1280x720' }
    }
  ];

  const [presets, setPresets] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loaded = localStorage.getItem('user-presets');
    if (loaded) {
      setPresets(JSON.parse(loaded));
    } else {
      setPresets(defaultPresets);
      localStorage.setItem('user-presets', JSON.stringify(defaultPresets));
    }
  }, []);

  const savePresets = (newPresets) => {
    setPresets(newPresets);
    localStorage.setItem('user-presets', JSON.stringify(newPresets));
  };

  const handleApply = (presetData) => {
    onApplyPreset(presetData);
    setSuccessMsg('Preset Applied! Go to Compressor to see changes.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = (id) => {
    const filtered = presets.filter(p => p.id !== id);
    savePresets(filtered);
  };

  return (
    <div className="home-cosmic-wrapper expanded">
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bookmark size={28} className="glow-icon accent-blue" /> Preset Manager
          </h1>
          <p>Apply or manage configuration presets for the compressor.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {presets.map((preset) => (
            <div key={preset.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0 }}>{preset.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>{preset.description}</p>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {Object.entries(preset.data).map(([k, v]) => (
                  <div key={k}><span style={{ color: '#00f2fe' }}>{k}:</span> {v}</div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="holographic-btn" onClick={() => handleApply(preset.data)} style={{ flex: 1, padding: '6px', fontSize: '12px', justifyContent: 'center' }}>
                  Apply Preset
                </button>
                <button className="qa-button" onClick={() => handleDelete(preset.id)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'transparent' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', cursor: 'not-allowed', opacity: 0.5 }}>
            <Plus size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>Create Custom Preset</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Configure in Compressor to save</div>
          </div>
        </div>
      </div>
    </div>
  );
}
