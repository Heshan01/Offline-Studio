import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function DropZone({ dragActive, onDrag, onDrop, onClick }) {
  return (
    <div
      className={`dropzone-container ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div className="dropzone-icon">
        <UploadCloud size={32} />
      </div>
      <div className="dropzone-text">
        Drag and drop your video file here, or <span className="select-button-inline">browse</span>
      </div>
      <div className="dropzone-subtext">
        Supports MP4, MKV, MOV, AVI, and other local containers
      </div>
    </div>
  );
}
