import React from 'react';
import { Plus, FolderPlus, Video, Zap, Play } from 'lucide-react';

export default function QuickActions({ onSelectFile, onAddFolder, onRecordScreen, onQuickCompress, onPreview }) {
  return (
    <div className="quick-actions-bar">
      <button className="qa-button" onClick={onSelectFile}>
        <Plus size={14} /> Add Video
      </button>
      <button className="qa-button" onClick={onAddFolder}>
        <FolderPlus size={14} /> Add Folder
      </button>
      <button className="qa-button" onClick={onRecordScreen}>
        <Video size={14} /> Record Screen
      </button>
      <button className="qa-button" onClick={onQuickCompress}>
        <Zap size={14} /> Quick Compress
      </button>
      <button className="qa-button" onClick={onPreview}>
        <Play size={14} /> Preview
      </button>
    </div>
  );
}
