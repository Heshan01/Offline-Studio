import React, { useState, useEffect } from 'react';
import DropZone from './DropZone';
import FileDetails from './FileDetails';
import ErrorBanner from './ErrorBanner';
import ProgressPanel from './ProgressPanel';
import SuccessPanel from './SuccessPanel';

export default function ConverterView({ formatSize, onCompletedGlobal }) {
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState('mp4'); // mp4, mkv, webm, avi, mov, gif
  const [gpu, setGpu] = useState('none');
  const [dragActive, setDragActive] = useState(false);

  // Process States
  const [status, setStatus] = useState('idle'); // idle, ready, converting, completed
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
        setStatus('converting');
        setProgress(0);
      } else if (data.status === 'duration_parsed') {
        setDurationStr(data.durationStr);
      } else if (data.status === 'processing') {
        setStatus('converting');
        setProgress(data.percent);
        if (data.timeElapsed) setTimeElapsed(data.timeElapsed);
      }
    });

    const removeCompletedListener = window.electronAPI.onCompressionCompleted((data) => {
      setProgress(100);
      setStatus('completed');
      setOutputPath(data.outputPath);
      setError(null);

      // Trigger global metrics update
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
  }, [file, onCompletedGlobal]);

  const handleSelectFile = async () => {
    setError(null);
    try {
      const selected = await window.electronAPI.selectFile();
      if (selected) {
        setFile(selected);
        setStatus('ready');
        setProgress(0);
        setOutputPath('');
      }
    } catch (err) {
      setError("Failed to open file dialog: " + err.message);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'converting') return;
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
    if (status === 'converting') return;

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
        setOutputPath('');
        setError(null);
      }
    }
  };

  const handleStartConversion = () => {
    if (!file || status === 'converting') return;
    setError(null);
    setStatus('converting');
    setProgress(0);

    const config = {
      action: 'convert',
      format: outputFormat,
      gpu: gpu,
      preset: 'fast'
    };

    window.electronAPI.startCompression(file.path, config);
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setOutputPath('');
    setError(null);
  };

  return (
    <div className="tab-view-container">
      <div className="view-header">
        <h2>Offline Video Converter</h2>
        <p>Convert videos to other container formats locally without uploads</p>
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

      {(status === 'ready' || (status === 'converting' && progress === 0 && !timeElapsed)) && file && (
        <div>
          <FileDetails file={file} formatSize={formatSize} />

          {status !== 'converting' && (
            <div className="settings-panel">
              <h3 className="settings-title">Conversion Options</h3>
              
              <div className="settings-grid">
                <div className="settings-row">
                  <label className="settings-label">Output Target Format</label>
                  <select 
                    className="settings-select"
                    value={outputFormat} 
                    onChange={(e) => setOutputFormat(e.target.value)}
                  >
                    <option value="mp4">MP4 (.mp4 - Highly Compatible H.264)</option>
                    <option value="mkv">MKV (.mkv - Lossless copy compatible)</option>
                    <option value="webm">WebM (.webm - Web friendly VP9)</option>
                    <option value="avi">AVI (.avi - Legacy raw container)</option>
                    <option value="mov">MOV (.mov - Apple standard)</option>
                    <option value="gif">GIF (.gif - Animated loop image)</option>
                  </select>
                </div>

                <div className="settings-row">
                  <label className="settings-label">GPU Hardware Encoding</label>
                  <select 
                    className="settings-select"
                    value={gpu} 
                    disabled={outputFormat === 'gif'}
                    onChange={(e) => setGpu(e.target.value)}
                  >
                    <option value="none">None (CPU - Highly Compatible)</option>
                    <option value="nvidia">NVIDIA (NVENC Acceleration)</option>
                    <option value="intel">Intel (QSV Acceleration)</option>
                    <option value="amd">AMD (AMF Acceleration)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {status !== 'converting' ? (
            <button className="action-button btn-primary" onClick={handleStartConversion}>
              🔄 Transcode Format
            </button>
          ) : (
            <div className="status-log">Initializing conversion subprocess...</div>
          )}

          {status !== 'converting' && (
            <button className="action-button btn-secondary" onClick={handleReset}>
              Choose Different File
            </button>
          )}
        </div>
      )}

      {status === 'converting' && (progress > 0 || timeElapsed) && (
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
