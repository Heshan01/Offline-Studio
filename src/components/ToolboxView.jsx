import React, { useState, useEffect } from 'react';
import DropZone from './DropZone';
import FileDetails from './FileDetails';
import ErrorBanner from './ErrorBanner';
import ProgressPanel from './ProgressPanel';
import SuccessPanel from './SuccessPanel';

export default function ToolboxView({ formatSize, onCompletedGlobal }) {
  const [activeTool, setActiveTool] = useState(null); // null, 'extract_audio', 'gif'
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // States
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('idle'); // idle, ready, processing, completed
  const [progress, setProgress] = useState(0);
  const [durationStr, setDurationStr] = useState('');
  const [timeElapsed, setTimeElapsed] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    const removeProgressListener = window.electronAPI.onCompressionProgress((data) => {
      setError(null);
      if (data.status === 'started') {
        setStatus('processing');
        setProgress(0);
      } else if (data.status === 'duration_parsed') {
        setDurationStr(data.durationStr);
        if (!endTime) {
          setEndTime(data.durationStr);
        }
      } else if (data.status === 'processing') {
        setStatus('processing');
        setProgress(data.percent);
        if (data.timeElapsed) setTimeElapsed(data.timeElapsed);
      }
    });

    const removeCompletedListener = window.electronAPI.onCompressionCompleted((data) => {
      setProgress(100);
      setStatus('completed');
      setOutputPath(data.outputPath);
      setError(null);

      if (onCompletedGlobal) {
        onCompletedGlobal(file, data.outputSize, data.outputPath);
      }

      if (data.outputPath) {
        window.electronAPI.openOutputFolder(data.outputPath);
      }
    });

    const removeErrorListener = window.electronAPI.onCompressionError((errMessage) => {
      setError(errMessage);
      setStatus('ready');
      setProgress(0);
    });

    return () => {
      if (typeof removeProgressListener === 'function') removeProgressListener();
      if (typeof removeCompletedListener === 'function') removeCompletedListener();
      if (typeof removeErrorListener === 'function') removeErrorListener();
    };
  }, [file, endTime, onCompletedGlobal]);

  const handleSelectFile = async () => {
    setError(null);
    try {
      const selected = await window.electronAPI.selectFile();
      if (selected) {
        setFile(selected);
        setStatus('ready');
        setProgress(0);
        setStartTime('00:00:00');
        setEndTime('');
        setOutputPath('');
      }
    } catch (err) {
      setError("Failed to open file dialog: " + err.message);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'processing') return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (status === 'processing') return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.path) {
        setFile({
          path: droppedFile.path,
          name: droppedFile.name,
          size: droppedFile.size
        });
        setStatus('ready');
        setProgress(0);
        setStartTime('00:00:00');
        setEndTime('');
        setOutputPath('');
        setError(null);
      }
    }
  };

  const handleExecuteTool = () => {
    if (!file || status === 'processing') return;

    const timeFormat = /^(\d{2}):(\d{2}):(\d{2})$/;
    if (activeTool === 'gif') {
      if (startTime && !timeFormat.test(startTime)) {
        setError("Start time must follow HH:MM:SS format (e.g., 00:01:30)");
        return;
      }
      if (endTime && !timeFormat.test(endTime)) {
        setError("End time must follow HH:MM:SS format (e.g., 00:02:15)");
        return;
      }
    }

    setError(null);
    setStatus('processing');
    setProgress(0);

    const config = {
      action: activeTool,
      startTime: activeTool === 'gif' ? startTime : undefined,
      endTime: activeTool === 'gif' ? endTime : undefined
    };

    window.electronAPI.startCompression(file.path, config);
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setStartTime('00:00:00');
    setEndTime('');
    setOutputPath('');
    setError(null);
  };

  const handleBackToGrid = () => {
    handleReset();
    setActiveTool(null);
  };

  return (
    <div className="tab-view-container">
      {/* 1. Selection Grid */}
      {!activeTool && (
        <div>
          <div className="view-header">
            <h2>Quick Utility Toolbox</h2>
            <p>Select a quick, single-purpose tool to run offline</p>
          </div>
          
          <div className="toolbox-grid">
            <div className="toolbox-card" onClick={() => setActiveTool('extract_audio')}>
              <span className="toolbox-card-icon">🎧</span>
              <h3>Audio Extractor</h3>
              <p>Strips audio tracks from your video and encodes them as MP3 audio files.</p>
            </div>

            <div className="toolbox-card" onClick={() => setActiveTool('gif')}>
              <span className="toolbox-card-icon">🖼️</span>
              <h3>GIF Generator</h3>
              <p>Converts a video segment into an optimized, looping animated GIF.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Audio Extractor Mode */}
      {activeTool === 'extract_audio' && (
        <div>
          <div className="toolbox-sub-header">
            <button className="back-btn" onClick={handleBackToGrid} type="button">
              ← Back to grid
            </button>
            <h2>🎧 Audio Extractor (Video to MP3)</h2>
          </div>

          {error && <ErrorBanner error={error} />}

          {status === 'idle' && (
            <DropZone 
              dragActive={dragActive} 
              onDrag={handleDrag} 
              onDrop={handleDrop} 
              onClick={handleSelectFile} 
            />
          )}

          {(status === 'ready' || (status === 'processing' && progress === 0 && !timeElapsed)) && file && (
            <div>
              <FileDetails file={file} formatSize={formatSize} />
              
              {status !== 'processing' ? (
                <button className="action-button btn-primary" onClick={handleExecuteTool}>
                  🎧 Extract MP3 File
                </button>
              ) : (
                <div className="status-log">Extracting audio track...</div>
              )}

              {status !== 'processing' && (
                <button className="action-button btn-secondary" onClick={handleReset}>
                  Choose Different File
                </button>
              )}
            </div>
          )}

          {status === 'processing' && (progress > 0 || timeElapsed) && (
            <ProgressPanel 
              file={file} 
              progress={progress} 
              durationStr={durationStr} 
              timeElapsed={timeElapsed} 
            />
          )}

          {status === 'completed' && (
            <SuccessPanel 
              outputPath={outputPath} 
              onOpenFolder={() => window.electronAPI.openOutputFolder(outputPath)} 
              onReset={handleReset} 
            />
          )}
        </div>
      )}

      {/* 3. GIF Creator Mode */}
      {activeTool === 'gif' && (
        <div>
          <div className="toolbox-sub-header">
            <button className="back-btn" onClick={handleBackToGrid} type="button">
              ← Back to grid
            </button>
            <h2>🖼️ GIF Creator (Video to Loop GIF)</h2>
          </div>

          {error && <ErrorBanner error={error} />}

          {status === 'idle' && (
            <DropZone 
              dragActive={dragActive} 
              onDrag={handleDrag} 
              onDrop={handleDrop} 
              onClick={handleSelectFile} 
            />
          )}

          {(status === 'ready' || (status === 'processing' && progress === 0 && !timeElapsed)) && file && (
            <div>
              <FileDetails file={file} formatSize={formatSize} />

              {status !== 'processing' && (
                <div className="settings-panel">
                  <h3 className="settings-title">GIF Segment Selection</h3>
                  <div className="settings-grid">
                    <div className="settings-row">
                      <label className="settings-label">Start Clip (HH:MM:SS)</label>
                      <input 
                        className="settings-input"
                        type="text" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="settings-row">
                      <label className="settings-label">End Clip (HH:MM:SS)</label>
                      <input 
                        className="settings-input"
                        type="text" 
                        placeholder="00:00:00"
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {status !== 'processing' ? (
                <button className="action-button btn-primary" onClick={handleExecuteTool}>
                  🖼️ Generate Loop GIF
                </button>
              ) : (
                <div className="status-log">Encoding GIF frames...</div>
              )}

              {status !== 'processing' && (
                <button className="action-button btn-secondary" onClick={handleReset}>
                  Choose Different File
                </button>
              )}
            </div>
          )}

          {status === 'processing' && (progress > 0 || timeElapsed) && (
            <ProgressPanel 
              file={file} 
              progress={progress} 
              durationStr={durationStr} 
              timeElapsed={timeElapsed} 
            />
          )}

          {status === 'completed' && (
            <SuccessPanel 
              outputPath={outputPath} 
              onOpenFolder={() => window.electronAPI.openOutputFolder(outputPath)} 
              onReset={handleReset} 
            />
          )}
        </div>
      )}
    </div>
  );
}
