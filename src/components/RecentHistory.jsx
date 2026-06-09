import React from 'react';

export default function RecentHistory({ history, onOpenFolder, formatSize }) {
  if (!history || history.length === 0) {
    return null;
  }

  const getSavingsPercent = (orig, comp) => {
    if (!orig || !comp || orig <= comp) return '0%';
    const pct = ((orig - comp) / orig) * 100;
    return `-${pct.toFixed(0)}%`;
  };

  return (
    <div className="recent-history-section">
      <h3 className="history-title">Recent Conversions</h3>
      <div className="history-list">
        {history.map((item) => (
          <div className="history-item" key={item.id}>
            <div className="history-item-left">
              <span className="history-video-icon">🎥</span>
              <div className="history-meta">
                <span className="history-name" title={item.name}>{item.name}</span>
                <span className="history-sizes">
                  {formatSize(item.originalSize)} → {formatSize(item.compressedSize)}
                </span>
              </div>
            </div>
            
            <div className="history-item-right">
              <span className="history-badge">
                {getSavingsPercent(item.originalSize, item.compressedSize)}
              </span>
              <button 
                className="history-folder-btn"
                onClick={() => onOpenFolder(item.outputPath)}
                title="Open containing folder"
                type="button"
              >
                📂
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
