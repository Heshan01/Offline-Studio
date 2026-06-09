import React, { useState } from 'react';
import { Layers } from 'lucide-react';

export default function BatchCompressor({ onBack }) {
  const [fileQueue, setFileQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectFiles = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectFile();
      if (selected) {
        setFileQueue(prev => [...prev, { ...selected, status: 'pending' }]);
      }
    }
  };

  const handleStartBatch = () => {
    if (fileQueue.length === 0) return;
    setIsProcessing(true);
    
    const updated = [...fileQueue];
    updated[0].status = 'compressing';
    setFileQueue(updated);
    
    if (window.electronAPI) {
      const config = { action: 'compress', mode: 'quality', crf: 23, preset: 'fast', container: 'mp4' };
      window.electronAPI.startCompression(fileQueue[0].path, config);
    }
  };

  return (
    <div className="home-cosmic-wrapper">
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={28} className="glow-icon accent-blue" /> Batch Compressor
          </h1>
          <p>Drop multiple files here to compress them sequentially unattended.</p>
        </div>
      </div>

      <div className="batch-container glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div className="batch-actions-row" style={{ display: 'flex', gap: '16px' }}>
          <button className="holographic-btn" onClick={handleSelectFiles} disabled={isProcessing} style={{ flex: 1, justifyContent: 'center' }}>
            ➕ Add File to Queue
          </button>
          {fileQueue.length > 0 && (
            <button className="holographic-btn" onClick={handleStartBatch} disabled={isProcessing} style={{ flex: 1, justifyContent: 'center' }}>
              🚀 Start Batch
            </button>
          )}
        </div>

        <div className="batch-queue-box" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '20px', flex: 1, minHeight: '300px' }}>
          {fileQueue.length === 0 ? (
            <div className="batch-queue-empty" style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '60px', fontFamily: 'Consolas, monospace' }}>
              [ QUEUE_EMPTY ]
            </div>
          ) : (
            <div className="queue-list">
              {fileQueue.map((f, i) => (
                <div key={i} className={`queue-item`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="queue-item-info">
                    <span className="file-name">{f.name}</span>
                    <span className={`batch-queue-status`} style={{ color: f.status === 'compressing' ? '#00f2fe' : 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'Consolas, monospace' }}>
                      {f.status}
                    </span>
                  </div>
                  {f.status === 'compressing' && (
                    <div className="progress-track" style={{ height: '3px', marginTop: '4px' }}>
                       <div className="progress-fill" style={{ width: '50%' }}><div className="progress-glow"></div></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
