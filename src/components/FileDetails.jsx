import React from 'react';

export default function FileDetails({ file, formatSize }) {
  return (
    <>
      <div className="file-row">
        <span className="file-label">File Name</span>
        <span className="file-value">{file.name}</span>
      </div>
      <div className="file-row">
        <span className="file-label">File Size</span>
        <span className="file-value">{formatSize(file.size)}</span>
      </div>
      <div className="file-row">
        <span className="file-label">Source Path</span>
        <span className="file-value path" title={file.path}>{file.path}</span>
      </div>
    </>
  );
}
