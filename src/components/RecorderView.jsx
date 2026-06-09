import React, { useState, useEffect, useRef } from 'react';
import ErrorBanner from './ErrorBanner';
import { RefreshCw, Play, Square, FolderOpen, Video } from 'lucide-react';

export default function RecorderView({ formatSize, onCompletedGlobal }) {
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [audioSource, setAudioSource] = useState('none'); // none, internal, mic, both
  const [outputFormat, setOutputFormat] = useState('webm');
  const [customPath, setCustomPath] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Preview and Media elements
  const [stream, setStream] = useState(null);
  const [outputPath, setOutputPath] = useState('');
  const [error, setError] = useState(null);

  const videoPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null); // Keep track of AudioContext

  useEffect(() => {
    refreshSources();
    return () => {
      stopStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Ensure preview attaches when it mounts (e.g. when recording starts)
  useEffect(() => {
    if (recording && videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
      videoPreviewRef.current.play().catch(e => console.log('Preview play blocked:', e));
    }
  }, [recording, stream]);

  const stopStreams = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const refreshSources = async () => {
    if (!window.electronAPI) return;
    try {
      const srcList = await window.electronAPI.getScreenSources();
      setSources(srcList);
      if (srcList.length > 0 && !selectedSourceId) {
        setSelectedSourceId(srcList[0].id);
      }
    } catch (err) {
      setError("Failed to fetch windows/displays: " + err.message);
    }
  };

  const handleStartRecording = async () => {
    if (!selectedSourceId) {
      setError("Please select a recording source first.");
      return;
    }
    setError(null);
    setOutputPath('');
    chunksRef.current = [];
    setRecordingTime(0);

    try {
      const desktopConstraints = {
        audio: (audioSource === 'internal' || audioSource === 'both') ? {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSourceId
          }
        } : false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSourceId
          }
        }
      };

      const desktopStream = await navigator.mediaDevices.getUserMedia(desktopConstraints);
      let finalStream = desktopStream;

      if (audioSource === 'mic' || audioSource === 'both') {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        if (audioSource === 'both') {
          // Merge desktop and mic audio using Web Audio API
          const audioCtx = new AudioContext();
          audioCtxRef.current = audioCtx;
          const dest = audioCtx.createMediaStreamDestination();

          if (desktopStream.getAudioTracks().length > 0) {
            const desktopSource = audioCtx.createMediaStreamSource(new MediaStream([desktopStream.getAudioTracks()[0]]));
            desktopSource.connect(dest);
          }
          if (micStream.getAudioTracks().length > 0) {
            const micSource = audioCtx.createMediaStreamSource(micStream);
            micSource.connect(dest);
          }
          
          finalStream = new MediaStream([
            desktopStream.getVideoTracks()[0],
            ...dest.stream.getAudioTracks()
          ]);
        } else if (audioSource === 'mic') {
          // Just use the mic track instead of desktop
          finalStream = new MediaStream([
            desktopStream.getVideoTracks()[0],
            ...micStream.getAudioTracks()
          ]);
        }
      }

      setStream(finalStream);

      // Configure media recorder
      const options = { mimeType: 'video/webm; codecs=vp9' };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(finalStream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(finalStream);
      }
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const fileName = `ScreenRec_${Date.now()}.webm`;

        try {
          const res = await window.electronAPI.saveRecording(uint8Array, fileName, customPath);
          if (res.success) {
            
            // Post-process to MP4 if selected
            if (outputFormat === 'mp4') {
              window.electronAPI.startCompression(res.outputPath, {
                action: 'convert',
                container: 'mp4',
                videoCodec: 'h264',
                audioCodec: 'aac',
                preset: 'fast'
              });
              // Change output path extension visually for the success banner
              setOutputPath(res.outputPath.replace('.webm', '.mp4'));
            } else {
              setOutputPath(res.outputPath);
            }

            if (onCompletedGlobal) {
              onCompletedGlobal({ name: fileName, size: blob.size }, blob.size, res.outputPath);
            }
          } else {
            setError("Failed to save file: " + res.error);
          }
        } catch (saveErr) {
          setError("Failed to write buffer: " + saveErr.message);
        }
        
        stopStreams();
      };

      mediaRecorder.start(1000); // chunk slices
      setRecording(true);

      // Start counter timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError("Could not access media stream. Error: " + err.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTimer = (seconds) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <div className="home-cosmic-wrapper">
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Video size={28} className="glow-icon accent-blue" /> Offline Screen Recorder
          </h1>
          <p>Capture native monitors or specific application windows locally</p>
        </div>
      </div>

      {error && <ErrorBanner error={error} />}

      {!recording && !outputPath && (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="sources-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>Select Windows or Screen</h3>
            <button className="qa-button" onClick={refreshSources} type="button" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', fontSize: '11px' }}>
              <RefreshCw size={12} style={{ marginRight: '6px' }} /> Refresh List
            </button>
          </div>

          <div className="sources-grid" style={{ flex: 1, overflowY: 'auto' }}>
            {sources.map((source) => (
              <div 
                key={source.id} 
                className={`source-card ${selectedSourceId === source.id ? 'active' : ''}`}
                onClick={() => setSelectedSourceId(source.id)}
                style={{
                  background: selectedSourceId === source.id ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${selectedSourceId === source.id ? '#00f2fe' : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: selectedSourceId === source.id ? '0 0 15px rgba(0, 242, 254, 0.2)' : 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="source-thumbnail-container" style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                  <img src={source.thumbnailUrl} alt={source.name} className="source-thumbnail" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="source-name" title={source.name} style={{ padding: '10px', fontSize: '11px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{source.name}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 10px', marginTop: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Audio Source:</label>
              <select 
                value={audioSource} 
                onChange={e => setAudioSource(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', fontSize: '12px', outline: 'none' }}
              >
                <option value="none">None (Video Only)</option>
                <option value="internal">Internal System Sound</option>
                <option value="mic">Microphone</option>
                <option value="both">Both (Internal + Mic)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Format:</label>
              <select 
                value={outputFormat} 
                onChange={e => setOutputFormat(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', fontSize: '12px', outline: 'none' }}
              >
                <option value="webm">.webm (Native / Fast)</option>
                <option value="mp4">.mp4 (H264 Compatible)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Save To:</label>
              <div style={{ display: 'flex', width: '100%' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={customPath || 'Default (Desktop/Optimized_Videos)'} 
                  style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', color: 'var(--text-main)', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', fontSize: '11px', outline: 'none' }}
                />
                <button 
                  onClick={async () => {
                    const path = await window.electronAPI.selectFolder();
                    if (path) setCustomPath(path);
                  }}
                  style={{ padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', cursor: 'pointer', fontSize: '11px' }}
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

          <button className="holographic-btn" style={{ marginTop: '24px', justifyContent: 'center' }} onClick={handleStartRecording}>
            <Play size={16} fill="currentColor" /> Start Recording Source
          </button>
        </div>
      )}

      {recording && (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="recording-glow-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', background: 'rgba(255, 0, 127, 0.1)', padding: '12px 24px', borderRadius: '30px', border: '1px solid rgba(255, 0, 127, 0.3)', boxShadow: '0 0 20px rgba(255, 0, 127, 0.2)' }}>
            <span className="recording-dot" style={{ width: '12px', height: '12px', background: '#ff007f', borderRadius: '50%', boxShadow: '0 0 10px #ff007f', animation: 'pulse 1s infinite' }}></span>
            <span className="recording-timer" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff007f', fontFamily: 'Consolas, monospace' }}>Recording: {formatTimer(recordingTime)}</span>
          </div>

          <div className="video-preview-wrapper" style={{ width: '80%', maxWidth: '800px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <video 
              ref={videoPreviewRef} 
              autoPlay 
              muted 
              className="video-preview-element"
              style={{ width: '100%', display: 'block' }}
            />
          </div>

          <button className="holographic-btn" style={{ marginTop: '30px', '--accent-primary': '#ff007f' }} onClick={handleStopRecording}>
            <Square size={16} fill="currentColor" /> Stop Recording & Save
          </button>
        </div>
      )}

      {outputPath && (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="success-icon-wrapper" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '24px', border: '2px solid #10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)', marginBottom: '20px' }}>✓</div>
          <div className="success-title" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '10px' }}>Recording Saved!</div>
          <div className="success-msg" style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', maxWidth: '400px', marginBottom: '24px', lineHeight: '1.5' }}>
            Your recording has been compiled successfully and saved to <strong>Optimized_Videos</strong> on your Desktop.
          </div>

          <div className="file-details-card" style={{ width: '100%', maxWidth: '500px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
            <div className="file-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px' }}>
              <span className="file-label" style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Output Path</span>
              <span className="file-value path" style={{ color: '#00f2fe', fontSize: '11px', fontFamily: 'Consolas, monospace', wordBreak: 'break-all', textAlign: 'right' }}>{outputPath}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="holographic-btn" style={{ '--accent-primary': '#10b981' }} onClick={() => window.electronAPI.openOutputFolder(outputPath)}>
              <FolderOpen size={16} /> Open Containing Directory
            </button>

            <button className="qa-button" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => setOutputPath('')}>
              <Video size={16} style={{ marginRight: '8px' }} /> Record Another Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
