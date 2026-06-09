import React, { useState } from 'react';
import GenericView from './GenericView';
import { 
  Settings, Shield, Cpu, Sparkles, Folder, Zap,
  FileEdit, Database, ListTree, CheckCircle, Layout, Activity, Power, RefreshCw
} from 'lucide-react';

export default function SettingsView({ 
  theme, setTheme, 
  outputFolder, setOutputFolder,
  gpu, setGpu,
  onSelectOutputFolder,
  onBack 
}) {
  const [activeTab, setActiveTab] = useState('performance');

  const tabs = [
    { id: 'performance', label: 'Performance & Hardware', icon: <Zap size={14} /> },
    { id: 'storage', label: 'Storage & Export', icon: <Folder size={14} /> },
    { id: 'naming', label: 'File Naming & Rules', icon: <FileEdit size={14} /> },
    { id: 'cache', label: 'Cache Management', icon: <Database size={14} /> },
    { id: 'queue', label: 'Task Queue & Auto', icon: <ListTree size={14} /> },
    { id: 'post', label: 'Post-Processing', icon: <CheckCircle size={14} /> },
    { id: 'theme', label: 'Theme & Visuals', icon: <Sparkles size={14} /> },
    { id: 'layout', label: 'Interface & Layout', icon: <Layout size={14} /> },
    { id: 'monitor', label: 'System Monitoring', icon: <Activity size={14} /> },
    { id: 'startup', label: 'Startup & Background', icon: <Power size={14} /> },
    { id: 'updates', label: 'Updates & Maintenance', icon: <RefreshCw size={14} /> }
  ];

  const themesList = [
    {
      id: 'cosmic-neon',
      name: 'Cosmic Neon',
      description: 'Cyberpunk look with glowing pink & cyan accents. High visual quality.',
      colors: ['#07070f', '#00f2fe', '#ff007f'],
      performance: 'High GPU/CPU load'
    },
    {
      id: 'emerald-cyber',
      name: 'Emerald Cyber',
      description: 'Matrix-inspired deep green and slate design. High visual quality.',
      colors: ['#050906', '#10b981', '#34d399'],
      performance: 'High GPU/CPU load'
    },
    {
      id: 'classic-slate',
      name: 'Classic Slate',
      description: 'Original Premiere Pro inspired monochrome design. Standard visuals.',
      colors: ['#0a0a0a', '#ffffff', '#a3a3a3'],
      performance: 'Medium GPU/CPU load'
    },
    {
      id: 'basic-pc',
      name: 'Basic PC',
      description: 'Flat, high-performance styling. Disables animations, blurs, and shadows.',
      colors: ['#121212', '#007acc', '#8b949e'],
      performance: 'Ultra-low GPU/CPU load'
    }
  ];

  return (
    <GenericView 
      title="Global Settings" 
      icon={<Settings size={22} />} 
      description="Configure your workspace preferences and system behavior."
      onBack={onBack}
    >
      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map(t => (
            <button 
              key={t.id} 
              className={`settings-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <div className="settings-tab-icon">{t.icon}</div>
              <span className="settings-tab-label">{t.label}</span>
            </button>
          ))}
        </div>
        
        <div className="settings-content">
           {/* PERFORMANCE */}
           {activeTab === 'performance' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><Zap size={16} style={{ color: 'var(--accent-primary)' }} /> Performance & Hardware Acceleration</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Hardware Acceleration</span>
                 <select className="custom-select" value={gpu} onChange={(e) => setGpu(e.target.value)} style={{ width: '120px', padding: '2px 4px', fontSize: '11px' }}>
                   <option value="none">None (CPU)</option>
                   <option value="nvenc">NVIDIA NVENC</option>
                   <option value="qsv">Intel QSV</option>
                   <option value="amf">AMD AMF</option>
                   <option value="videotoolbox">Apple VideoToolbox</option>
                 </select>
               </div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', paddingTop: '6px' }}>
                 <span className="file-label">Max CPU Threads</span>
                 <select className="custom-select" defaultValue="auto" style={{ width: '120px', padding: '2px 4px', fontSize: '11px' }}>
                   <option value="auto">Auto (All Cores)</option>
                   <option value="4">4 Threads</option>
                   <option value="8">8 Threads</option>
                   <option value="16">16 Threads</option>
                 </select>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Rendering Mode</span>
                 <span className="file-value">{theme === 'basic-pc' ? 'Static Draft (Low Resource)' : 'Hardware Blending'}</span>
               </div>
             </div>
           )}

           {/* STORAGE */}
           {activeTab === 'storage' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><Folder size={16} style={{ color: 'var(--accent-primary)' }} /> Storage & Export Locations</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Default Output Folder</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end', overflow: 'hidden' }}>
                   <span className="file-value path" title={outputFolder || 'Default Desktop Folder'} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '180px' }}>
                     {outputFolder || 'Default (Desktop/Optimized_Videos)'}
                   </span>
                   <button className="qa-button" onClick={onSelectOutputFolder} style={{ padding: '2px 6px', fontSize: '10px', height: '20px' }}>Browse</button>
                 </div>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Default Input Folder</span>
                 <button className="qa-button" style={{ padding: '2px 6px', fontSize: '10px', height: '20px' }}>Browse</button>
               </div>
             </div>
           )}

           {/* NAMING */}
           {activeTab === 'naming' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><FileEdit size={16} style={{ color: 'var(--accent-primary)' }} /> File Naming & Overwrite Rules</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Export Suffix</span>
                 <input type="text" className="custom-input" defaultValue="_optimized" style={{ width: '100px', fontSize: '11px', padding: '2px 6px', background: 'var(--bg-tertiary)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '2px' }} />
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Overwrite Existing Files</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" style={{ accentColor: 'var(--accent-primary)' }} />
                   <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Disabled</span>
                 </label>
               </div>
             </div>
           )}

           {/* CACHE */}
           {activeTab === 'cache' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><Database size={16} style={{ color: 'var(--accent-primary)' }} /> Cache Management</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Max Cache Size</span>
                 <select className="custom-select" defaultValue="5gb" style={{ width: '100px', padding: '2px 4px', fontSize: '11px' }}>
                   <option value="1gb">1 GB</option>
                   <option value="5gb">5 GB</option>
                   <option value="10gb">10 GB</option>
                   <option value="unlimited">Unlimited</option>
                 </select>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Clear Temporary Files</span>
                 <button className="action-button btn-secondary" style={{ padding: '2px 8px', fontSize: '10px', height: '24px', margin: 0 }}>Clear Now (342 MB)</button>
               </div>
             </div>
           )}

           {/* QUEUE */}
           {activeTab === 'queue' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><ListTree size={16} style={{ color: 'var(--accent-primary)' }} /> Task Queue & Automation</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Max Parallel Tasks</span>
                 <select className="custom-select" defaultValue="2" style={{ width: '80px', padding: '2px 4px', fontSize: '11px' }}>
                   <option value="1">1</option>
                   <option value="2">2</option>
                   <option value="4">4</option>
                 </select>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Auto-Start Added Items</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }} />
                   <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enabled</span>
                 </label>
               </div>
             </div>
           )}

           {/* POST */}
           {activeTab === 'post' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><CheckCircle size={16} style={{ color: 'var(--accent-primary)' }} /> Post-Processing Actions</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Open Folder on Completion</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }} />
                   <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enabled</span>
                 </label>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Play Sound on Finish</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }} />
                   <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enabled</span>
                 </label>
               </div>
             </div>
           )}

           {/* THEME */}
           {activeTab === 'theme' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><Sparkles size={16} style={{ color: 'var(--accent-primary)' }} /> Theme & Visual Styles</div>
               <div className="theme-selector-grid">
                 {themesList.map((t) => (
                   <div 
                     key={t.id}
                     className={`theme-card ${theme === t.id ? 'active' : ''}`}
                     onClick={() => setTheme(t.id)}
                   >
                     <div className="theme-card-title">{t.name}</div>
                     <div className="theme-card-desc">{t.description}</div>
                     <div className="theme-color-palette">
                       {t.colors.map((c, i) => <span key={i} className="color-dot" style={{ backgroundColor: c }} />)}
                     </div>
                     <span style={{ fontSize: '8px', marginTop: '6px', color: t.id === 'basic-pc' ? 'var(--accent-primary)' : 'var(--text-dark)', fontWeight: '600' }}>
                       {t.performance}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* LAYOUT */}
           {activeTab === 'layout' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><Layout size={16} style={{ color: 'var(--accent-primary)' }} /> Interface Layout & Sidebar</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Sidebar Default State</span>
                 <select className="custom-select" defaultValue="expanded" style={{ width: '100px', padding: '2px 4px', fontSize: '11px' }}>
                   <option value="expanded">Expanded</option>
                   <option value="collapsed">Collapsed</option>
                 </select>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Compact UI Mode</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" style={{ accentColor: 'var(--accent-primary)' }} />
                   <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Disabled</span>
                 </label>
               </div>
             </div>
           )}

           {/* MONITOR */}
           {activeTab === 'monitor' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><Activity size={16} style={{ color: 'var(--accent-primary)' }} /> System Monitoring</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Show FPS Counter</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" style={{ accentColor: 'var(--accent-primary)' }} />
                 </label>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Show Memory/CPU Usage</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }} />
                 </label>
               </div>
             </div>
           )}

           {/* STARTUP */}
           {activeTab === 'startup' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><Power size={16} style={{ color: 'var(--accent-primary)' }} /> Startup & Background</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Launch on Startup</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" style={{ accentColor: 'var(--accent-primary)' }} />
                 </label>
               </div>
               <div className="file-row" style={{ borderBottom: 'none', paddingBottom: '0', paddingTop: '6px' }}>
                 <span className="file-label">Minimize to System Tray</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }} />
                 </label>
               </div>
             </div>
           )}

           {/* UPDATES */}
           {activeTab === 'updates' && (
             <div className="settings-section-card fade-in">
               <div className="settings-section-title"><RefreshCw size={16} style={{ color: 'var(--accent-primary)' }} /> Updates & Maintenance</div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                 <span className="file-label">Auto-Download Updates</span>
                 <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }} />
                 </label>
               </div>
               <div className="file-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', paddingTop: '6px' }}>
                 <span className="file-label">Current Version</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Consolas, monospace' }}>v2.4.1 (Build 2026.06)</span>
                   <button className="action-button btn-primary" style={{ padding: '2px 8px', fontSize: '10px', height: '24px', margin: 0 }}>Check</button>
                 </div>
               </div>
               <div style={{ marginTop: '16px' }}>
                 <p className="success-msg" style={{ margin: 0, lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                   <Shield size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                   <span>This application operates in a <strong>100% Offline Sandbox</strong>. No telemetry is collected. Updates are checked securely.</span>
                 </p>
               </div>
             </div>
           )}

        </div>
      </div>
    </GenericView>
  );
}
