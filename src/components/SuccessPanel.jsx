import React from 'react';
import { FolderOpen, Upload, Video } from 'lucide-react';

export default function SuccessPanel({ outputPath, onOpenFolder, onReset }) {
  return (
    <div className="success-panel">
      <div className="success-title">Compression Complete!</div>
      <div className="success-msg">
        Your video has been compressed successfully and saved to <strong>Optimized_Videos</strong> on your Desktop.
      </div>

      {outputPath && (
        <div className="file-details-card" style={{ width: '100%' }}>
          <div className="file-row">
            <span className="file-label">Output Path</span>
            <span className="file-value path">{outputPath}</span>
          </div>
        </div>
      )}

      <button className="action-button btn-primary" onClick={onOpenFolder}>
        <FolderOpen size={16} /> Open Output Directory
      </button>

      <button className="action-button btn-secondary" onClick={onReset}>
        <Video size={16} /> Compress Another Video
      </button>
    </div>
  );
}
