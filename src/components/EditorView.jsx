import React, { useState, useEffect } from 'react';
import DropZone from './DropZone';
import FileDetails from './FileDetails';
import ErrorBanner from './ErrorBanner';
import ProgressPanel from './ProgressPanel';
import SuccessPanel from './SuccessPanel';

export default function EditorView({ formatSize, onCompletedGlobal }) {
  const [file, setFile] = useState(null);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('');
  const [rotation, setRotation] = useState('none'); // none, 90_cw, 90_ccw, 180
  const [dragActive, setDragActive] = useState(false);

  // States
  const [status, setStatus] = useState('idle'); // idle, ready, editing, completed
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
        setStatus('editing');
        setProgress(0);
      } else if (data.status === 'duration_parsed') {
        setDurationStr(data.durationStr);
        if (!endTime) {
          // Default endTime to duration parsed
          setEndTime(data.durationStr);
        }
      } else if (data.status === 'processing') {
        setStatus('editing');
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
    if (status === 'editing') return;
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
    if (status === 'editing') return;

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

  const handleStartEditing = () => {
    if (!file || status === 'editing') return;

    // Validate timestamps (HH:MM:SS format)
    const timeFormat = /^(\d{2}):(\d{2}):(\d{2})$/;
    if (startTime && !timeFormat.test(startTime)) {
      setError("Start time must follow HH:MM:SS format (e.g., 00:01:30)");
      return;
    }
    if (endTime && !timeFormat.test(endTime)) {
      setError("End time must follow HH:MM:SS format (e.g., 00:02:15)");
      return;
    }

    setError(null);
    setStatus('editing');
    setProgress(0);

    const config = {
      action: 'edit',
      startTime: startTime,
      endTime: endTime,
      rotation: rotation
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

  return (
    <div className="tab-view-container">
      <div className="view-header">
        <h2>Offline Video Editor</h2>
        <p>Trim video lengths and apply rotation filters locally</p>
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

      {(status === 'ready' || (status === 'editing' && progress === 0 && !timeElapsed)) && file && (
        <div>
          <FileDetails file={file} formatSize={formatSize} />

          {status !== 'editing' && (
            <div className="settings-panel">
              <h3 className="settings-title">Editing Settings</h3>
              
              <div className="settings-grid">
                <div className="settings-row">
                  <label className="settings-label">Start Time (HH:MM:SS)</label>
                  <input 
                    className="settings-input"
                    type="text" 
                    placeholder="00:00:00"
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="settings-row">
                  <label className="settings-label">End Time (HH:MM:SS)</label>
                  <input 
                    className="settings-input"
                    type="text" 
                    placeholder="00:00:00"
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-row" style={{ marginTop: '10px' }}>
                <label className="settings-label">Video Rotation</label>
                <select 
                  className="settings-select"
                  value={rotation} 
                  onChange={(e) => setRotation(e.target.value)}
                >
                  <option value="none">No Rotation</option>
                  <option value="90_cw">Rotate 90° Clockwise</option>
                  <option value="90_ccw">Rotate 90° Counter-Clockwise</option>
                  <option value="180">Rotate 180° Flip</option>
                </select>
              </div>
            </div>
          )}

          {status !== 'editing' ? (
            <button className="action-button btn-primary" onClick={handleStartEditing}>
              ✂️ Process Video Edits
            </button>
          ) : (
            <div className="status-log">Applying edits...</div>
          )}

          {status !== 'editing' && (
            <button className="action-button btn-secondary" onClick={handleReset}>
              Choose Different File
            </button>
          )}
        </div>
      )}

      {status === 'editing' && (progress > 0 || timeElapsed) && (
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
  );
}
