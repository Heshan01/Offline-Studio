import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import QuickActions from './components/QuickActions';
import StatusBar from './components/StatusBar';

import StepIndicator from './components/StepIndicator';
import ErrorBanner from './components/ErrorBanner';
import DropZone from './components/DropZone';
import FileDetails from './components/FileDetails';
import ProgressPanel from './components/ProgressPanel';
import SuccessPanel from './components/SuccessPanel';
import FileCustomizer from './components/FileCustomizer';
import { 
  Zap, Bot, Music, FileText, Bookmark, Clock, 
  Download, Cloud, Settings, HelpCircle
} from 'lucide-react';

import BatchCompressor from './components/views/BatchCompressor';
import FormatConverter from './components/views/FormatConverter';
import VideoEditor from './components/views/VideoEditor';
import SubtitleEditor from './components/views/SubtitleEditor';
import PresetManager from './components/views/PresetManager';
import RecentFilesView from './components/views/RecentFilesView';
import DownloadsExportsView from './components/views/DownloadsExportsView';
import GenericView from './components/views/GenericView';
import RecorderView from './components/RecorderView';
import SettingsView from './components/views/SettingsView';
import HelpView from './components/views/HelpView';
import HomeView from './components/views/HomeView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('app-theme') || 'cosmic-neon';
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding-done');
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem('onboarding-done', 'true');
    setShowOnboarding(false);
  };
  
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, ready, compressing, completed
  const [progress, setProgress] = useState(0);
  const [durationStr, setDurationStr] = useState('');
  const [timeElapsed, setTimeElapsed] = useState('');
  const [eta, setEta] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [completedJobs, setCompletedJobs] = useState([]);
  
  const startTimeRef = useRef(null);
  
  // To avoid stale closures in listeners
  const fileRef = useRef(null);
  useEffect(() => { fileRef.current = file; }, [file]);
  
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Compression Settings State (Passed down to Customizer)
  const [mode, setMode] = useState('quality');
  const [crf, setCrf] = useState(23);
  const [preset, setPreset] = useState('fast');
  const [targetSizeMB, setTargetSizeMB] = useState(25);
  const [resolution, setResolution] = useState('original');
  const [gpu, setGpu] = useState('none');
  const [muteAudio, setMuteAudio] = useState(false);
  
  const [container, setContainer] = useState('mp4');
  const [videoCodec, setVideoCodec] = useState('h264');
  const [audioCodec, setAudioCodec] = useState('aac');
  const [filterDeinterlace, setFilterDeinterlace] = useState(false);
  const [filterDenoise, setFilterDenoise] = useState(false);
  const [filterGrayscale, setFilterGrayscale] = useState(false);
  const [outputFolder, setOutputFolder] = useState('');

  const applyPreset = (presetData) => {
    if (presetData.mode !== undefined) setMode(presetData.mode);
    if (presetData.crf !== undefined) setCrf(presetData.crf);
    if (presetData.preset !== undefined) setPreset(presetData.preset);
    if (presetData.targetSizeMB !== undefined) setTargetSizeMB(presetData.targetSizeMB);
    if (presetData.resolution !== undefined) setResolution(presetData.resolution);
    if (presetData.gpu !== undefined) setGpu(presetData.gpu);
    if (presetData.muteAudio !== undefined) setMuteAudio(presetData.muteAudio);
    if (presetData.container !== undefined) setContainer(presetData.container);
    if (presetData.videoCodec !== undefined) setVideoCodec(presetData.videoCodec);
    if (presetData.audioCodec !== undefined) setAudioCodec(presetData.audioCodec);
    if (presetData.filterDeinterlace !== undefined) setFilterDeinterlace(presetData.filterDeinterlace);
    if (presetData.filterDenoise !== undefined) setFilterDenoise(presetData.filterDenoise);
    if (presetData.filterGrayscale !== undefined) setFilterGrayscale(presetData.filterGrayscale);
  };

  useEffect(() => {
    if (!window.electronAPI) {
      setError("This application must be run inside the Electron desktop shell to utilize native filesystem compression.");
      return;
    }

    const removeProgressListener = window.electronAPI.onCompressionProgress((data) => {
      setError(null);
      if (data.status === 'started') {
        setStatus('compressing');
        setProgress(0);
        startTimeRef.current = Date.now();
        setEta('');
        if (data.outputPath) setOutputPath(data.outputPath);
        
        // If a sub-view started this, sync the file state globally so HomeView can display it
        if (!fileRef.current && data.file_name) {
          setFile({
            name: data.file_name,
            size: data.original_size || 0,
            path: data.input_path
          });
        }
      } else if (data.status === 'duration_parsed') {
        setDurationStr(data.durationStr);
      } else if (data.status === 'processing') {
        setStatus('compressing');
        setProgress(data.percent);
        if (data.timeElapsed) setTimeElapsed(data.timeElapsed);
        
        if (startTimeRef.current && data.percent > 0) {
            const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
            const totalEstimatedSeconds = elapsedSeconds / (data.percent / 100);
            const remainingSeconds = Math.max(0, totalEstimatedSeconds - elapsedSeconds);
            
            const h = Math.floor(remainingSeconds / 3600);
            const m = Math.floor((remainingSeconds % 3600) / 60);
            const s = Math.floor(remainingSeconds % 60);
            
            const hStr = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
            const mStr = `${m.toString().padStart(2, '0')}:`;
            const sStr = s.toString().padStart(2, '0');
            setEta(hStr + mStr + sStr);
        }
      }
    });

    const removeCompletedListener = window.electronAPI.onCompressionCompleted((data) => {
      setProgress(100);
      setStatus('completed');
      setEta('00:00');
      setOutputPath(data.outputPath);
      setError(null);
      
      if (fileRef.current) {
        setCompletedJobs(prev => [...prev, {
          id: Date.now(),
          name: fileRef.current.name,
          originalSize: fileRef.current.size,
          finalSize: data.output_size || 0,
          originalFile: fileRef.current,
          path: data.outputPath,
          outputPath: data.outputPath,
          status: 'done',
          progress: 100,
          eta: 'Completed',
          speed: '-'
        }]);
      }
      
      // Clear global file state after completing so next sub-view job can set it again
      // ONLY do this if we aren't in the main compressor view, because the compressor view needs the file to show the SuccessPanel
      if (activeTabRef.current !== 'compressor') {
        setFile(null);
        setStatus('idle');
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
  }, []);

  const formatSize = (bytes) => {
    if (!bytes) return '0.00 GB';
    const mb = bytes / (1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 0.1) {
      return `${gb.toFixed(3)} GB (${mb.toFixed(1)} MB)`;
    }
    return `${gb.toFixed(4)} GB (${mb.toFixed(1)} MB)`;
  };

  const handleSelectFile = async () => {
    if (status === 'compressing') return;
    setError(null);
    try {
      const selected = await window.electronAPI.selectFile();
      if (selected) {
        setFile(selected);
        setStatus('ready');
        setProgress(0);
        setDurationStr('');
        setTimeElapsed('');
        setEta('');
        setOutputPath('');
        setActiveTab('compressor'); // force switch to compressor tab on file load
      }
    } catch (err) {
      setError("Failed to open file dialog: " + err.message);
    }
  };

  const handleSelectOutputFolder = async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setOutputFolder(folder);
      }
    } catch (err) {
      setError("Failed to open folder dialog: " + err.message);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === 'compressing') return;
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
    if (status === 'compressing') return;

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
        setDurationStr('');
        setTimeElapsed('');
        setEta('');
        setOutputPath('');
        setError(null);
        setActiveTab('compressor');
      } else {
        setError("Could not retrieve native file path. Ensure the app is running in Electron.");
      }
    }
  };

  const handleStartCompression = () => {
    if (!file || status === 'compressing') return;
    setError(null);
    setStatus('compressing');
    setProgress(0);
    setEta('Calculating...');
    
    const config = {
      action: 'compress',
      mode, crf, preset, targetSizeMB, resolution, gpu, muteAudio,
      container, videoCodec, audioCodec, filterDeinterlace, filterDenoise, filterGrayscale,
      outputDir: outputFolder
    };
    
    window.electronAPI.startCompression(file.path, config);
  };

  const handleOpenFolder = () => {
    if (outputPath) {
      window.electronAPI.openOutputFolder(outputPath);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setDurationStr('');
    setTimeElapsed('');
    setEta('');
    setOutputPath('');
    setError(null);
  };

  const renderCompressorView = () => (
    <div className={`home-cosmic-wrapper ${file ? 'expanded' : ''}`}>
      <div className="home-header" style={{ marginBottom: '20px' }}>
        <div className="home-title-glow">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={28} className="glow-icon accent-blue" /> Video Compressor
          </h1>
          <p>Offline GPU/CPU lossless desktop compressor</p>
        </div>
      </div>

      {!file && <StepIndicator status={status} />}

      {status === 'idle' && !file && (
        <DropZone
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onClick={handleSelectFile}
        />
      )}

      {file && (
        <div className="dashboard-layout dual-pane">
          <div className="left-pane glass-panel">
            <div className="video-preview-container">
              <video 
                key={file.path}
                src={"local-media://" + file.path.replace(/\\/g, '/')}
                controls
                className="video-preview-element"
              />
            </div>

            <div className="file-details-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <FileDetails file={file} formatSize={formatSize} />

              <div className="file-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                <span className="file-label" style={{ minWidth: '90px' }}>Output Dir</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, justifyContent: 'flex-end' }}>
                  <span className="file-value path" title={outputFolder || 'Default Desktop Folder'} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '160px' }}>
                    {outputFolder || 'Default (Desktop/Optimized_Videos)'}
                  </span>
                  <button 
                    className="qa-button" 
                    onClick={handleSelectOutputFolder}
                    disabled={status === 'compressing'}
                    style={{ padding: '2px 6px', fontSize: '10px', height: '20px', width: 'auto', flexShrink: 0, background: 'rgba(255,255,255,0.1)' }}
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>

            {status === 'ready' && (
              <button className="holographic-btn" onClick={handleStartCompression} style={{ marginTop: '20px', width: '100%' }}>
                <Zap size={16} /> Compress Video
              </button>
            )}

            {status === 'compressing' && (
              <div style={{ marginTop: '20px' }}>
                {progress === 0 && !timeElapsed ? (
                   <div className="status-log">Initializing FFmpeg subprocess...</div>
                ) : (
                   <ProgressPanel file={file} progress={progress} durationStr={durationStr} timeElapsed={timeElapsed} eta={eta} />
                )}
                <button 
                  className="action-button" 
                  onClick={() => window.electronAPI.stopCompression()} 
                  style={{ marginTop: '12px', width: '100%', background: 'rgba(255, 50, 50, 0.2)', border: '1px solid rgba(255, 50, 50, 0.4)', color: '#ff8a8a' }}
                >
                  ■ Stop Processing
                </button>
              </div>
            )}

            {status === 'completed' && (
              <div style={{ marginTop: '20px' }}>
                <SuccessPanel outputPath={outputPath} onOpenFolder={handleOpenFolder} onReset={handleReset} />
              </div>
            )}

            {status !== 'compressing' && (
              <button className="action-button btn-secondary" onClick={handleReset} style={{ marginTop: '12px' }}>
                Choose Different File
              </button>
            )}
          </div>

          <div className="right-pane">
            <FileCustomizer 
              mode={mode} setMode={setMode} crf={crf} setCrf={setCrf} preset={preset} setPreset={setPreset}
              targetSizeMB={targetSizeMB} setTargetSizeMB={setTargetSizeMB} resolution={resolution} setResolution={setResolution}
              gpu={gpu} setGpu={setGpu} muteAudio={muteAudio} setMuteAudio={setMuteAudio}
              container={container} setContainer={setContainer} videoCodec={videoCodec} setVideoCodec={setVideoCodec}
              audioCodec={audioCodec} setAudioCodec={setAudioCodec} filterDeinterlace={filterDeinterlace} setFilterDeinterlace={setFilterDeinterlace}
              filterDenoise={filterDenoise} setFilterDenoise={setFilterDenoise} filterGrayscale={filterGrayscale} setFilterGrayscale={setFilterGrayscale}
            />
          </div>
        </div>
      )}
    </div>
  );

  const handleBack = () => setActiveTab('dashboard');

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HomeView activeJob={{ file, status, progress, eta }} completedJobs={completedJobs} onInitialize={() => setActiveTab('compressor')} />;
      case 'compressor': 
        return renderCompressorView();
      case 'batch': 
        return <BatchCompressor onBack={handleBack} />;
      case 'converter': 
        return <FormatConverter onBack={handleBack} />;
      case 'resize': 
        return <VideoEditor onBack={handleBack} defaultMode="resize" />;
      case 'mp3': 
        return <FormatConverter onBack={handleBack} defaultFormat="mp3" />;
      case 'subs': 
        return <SubtitleEditor onBack={handleBack} />;
      case 'presets': 
        return <PresetManager onBack={handleBack} onApplyPreset={applyPreset} />;
      case 'recent': 
        return <RecentFilesView onBack={handleBack} completedJobs={completedJobs} />;
      case 'downloads': 
        return <DownloadsExportsView onBack={handleBack} />;
      case 'cloud': 
        return <GenericView title="Cloud Storage" icon={<Cloud size={48} opacity={0.5} />} description="Sync with Google Drive & Dropbox." onBack={handleBack} />;
      case 'settings': 
        return (
          <SettingsView 
            theme={theme} setTheme={setTheme} 
            outputFolder={outputFolder} setOutputFolder={setOutputFolder}
            gpu={gpu} setGpu={setGpu}
            onSelectOutputFolder={handleSelectOutputFolder}
            onBack={handleBack} 
          />
        );
      case 'help': 
        return <HelpView onBack={handleBack} />;
      case 'recorder':
        return (
          <RecorderView 
            formatSize={formatSize} 
            onCompletedGlobal={(fileObj, size, path) => {
              setFile({
                path: path,
                name: fileObj.name,
                size: size
              });
              setStatus('ready');
              setActiveTab('compressor');
            }} 
          />
        );
      default: 
        return renderCompressorView();
    }
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      {/* Global Cosmic Engine */}
      {theme !== 'basic-pc' && (
        <>
          <div className="nebula-bg"></div>
          <div className="particle-vortex">
            <div className="particle p1"></div>
            <div className="particle p2"></div>
            <div className="particle p3"></div>
          </div>
        </>
      )}

      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-modal">
            <div className="onboarding-header">
              <h2>⚡ Welcome to Offline Video Studio</h2>
              <p>Choose your workspace theme design. Changes are applied instantly!</p>
            </div>
            
            <div className="theme-selector-grid">
              {[
                { id: 'cosmic-neon', name: 'Cosmic Neon', desc: 'Sleek cyberpunk theme with glowing colors', colors: ['#07070f', '#00f2fe', '#ff007f'] },
                { id: 'emerald-cyber', name: 'Emerald Cyber', desc: 'Matrix style emerald design', colors: ['#050906', '#10b981', '#34d399'] },
                { id: 'classic-slate', name: 'Classic Slate', desc: 'Original Premiere Pro monochrome slate', colors: ['#0a0a0a', '#ffffff', '#a3a3a3'] },
                { id: 'basic-pc', name: 'Basic PC', desc: 'High-performance theme for low-spec PCs', colors: ['#121212', '#007acc', '#8b949e'] },
              ].map((t) => (
                <div 
                  key={t.id} 
                  className={`theme-card ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  <div className="theme-card-title">{t.name}</div>
                  <div className="theme-card-desc" style={{ fontSize: '9px', marginTop: '2px' }}>{t.desc}</div>
                  <div className="theme-color-palette" style={{ marginTop: '8px' }}>
                    {t.colors.map((c, i) => (
                      <span key={i} className="color-dot" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '10px' }}>
              <p className="success-msg" style={{ fontSize: '10px', marginBottom: '16px' }}>
                * Workspace styles adapt instantly in the background. Tap any theme to preview.
              </p>
              <button className="action-button btn-primary" onClick={handleCloseOnboarding}>
                Confirm & Get Started
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-wrapper">
        <QuickActions 
          onSelectFile={handleSelectFile} 
          onAddFolder={() => setActiveTab('batch')} 
          onRecordScreen={() => setActiveTab('recorder')}
          onQuickCompress={() => setActiveTab('compressor')}
          onPreview={() => setActiveTab('resize')}
        />
        
        <div className="app-container">
          <div className="main-content">
            <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && <ErrorBanner error={error} />}
              {renderView()}
            </div>
          </div>
        </div>
        
        <StatusBar status={status} progress={progress} eta={eta} />
      </div>
    </div>
  );
}
