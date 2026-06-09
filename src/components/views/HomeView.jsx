import React from 'react';
import { Play, Activity, Cpu, HardDrive, Shield, ArrowRight, Video, FileText, Settings, Maximize } from 'lucide-react';

export default function HomeView({ activeJob = {}, completedJobs = [], onInitialize }) {
  const dynamicQueue = [...completedJobs];
  
  if (activeJob.file && (activeJob.status === 'compressing' || activeJob.status === 'ready' || activeJob.status === 'completed')) {
    if (activeJob.status !== 'completed') {
      dynamicQueue.unshift({
        id: 'active-job',
        name: activeJob.file.name,
        progress: activeJob.status === 'compressing' ? activeJob.progress : 0,
        speed: activeJob.status === 'compressing' ? 'Active' : '-',
        eta: activeJob.status === 'compressing' && activeJob.eta ? activeJob.eta : 'Pending',
        status: activeJob.status === 'compressing' ? 'processing' : 'ready'
      });
    }
  }

  const activeQueue = dynamicQueue.length > 0 ? dynamicQueue : [];

  const formats = [
    { ext: 'MP4', color: '#ff2a5f', desc: 'Universal' },
    { ext: 'MKV', color: '#00f2fe', desc: 'Lossless' },
    { ext: 'MOV', color: '#8b5cf6', desc: 'ProRes' },
    { ext: 'AVI', color: '#f59e0b', desc: 'Legacy' },
    { ext: 'MP3', color: '#10b981', desc: 'Audio' }
  ];

  return (
    <div className="home-cosmic-wrapper">
      <div className="home-header">
        <div className="home-title-glow">
          <h1>OFFLINE STUDIO</h1>
          <p>Advanced Local Video Processing Architecture</p>
        </div>
      </div>

      <div className="home-grid-layout">
        
        {/* Center: Processing Queue */}
        <div className="home-queue-panel glass-panel">
          <div className="panel-header">
            <Activity size={18} className="glow-icon" />
            <h2>Active Neural Pipeline</h2>
            <div className="pulse-indicator"></div>
          </div>
          
          <div className="queue-list" style={{ flex: 1, overflowY: 'auto' }}>
            {activeQueue.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', padding: '40px 0', fontSize: '12px' }}>
                No active or recent tasks in pipeline.
              </div>
            ) : (
              activeQueue.map((item, index) => (
                <div key={item.id} className="queue-item" style={{ animationDelay: `${index * 0.15}s`, opacity: item.status === 'done' ? 0.7 : 1 }}>
                  <div className="queue-item-info">
                    <Video size={14} className="file-icon" style={{ color: item.status === 'done' ? '#10b981' : 'currentColor' }} />
                    <span className="file-name" style={{ color: item.status === 'done' ? '#10b981' : 'var(--text-main)' }}>{item.name}</span>
                    <span className="file-eta" style={{ color: item.status === 'done' ? '#10b981' : 'var(--text-muted)' }}>{item.eta}</span>
                  </div>
                  
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.progress}%`, background: item.status === 'done' ? '#10b981' : 'linear-gradient(90deg, #00f2fe, #ff007f)' }}>
                      {item.status === 'processing' && <div className="progress-glow"></div>}
                    </div>
                  </div>
                  
                  <div className="queue-item-stats">
                    <span className="progress-text">{item.progress}%</span>
                    <span className="speed-text">{item.speed}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="holographic-btn" onClick={onInitialize}>
            <Play size={14} /> Initialize New Task
          </button>
        </div>

        {/* Right: Hardware Engine & Pipeline */}
        <div className="home-hardware-layout">
          <div className="home-widget glass-panel">
            <div className="panel-header">
              <Cpu size={16} className="glow-icon accent-blue" />
              <h3>Compression Engine</h3>
            </div>
            
            <div className="hardware-stats">
              <div className="stat-circle">
                <div className="stat-value">94<span className="stat-unit">%</span></div>
                <div className="stat-label">GPU Load</div>
                <svg className="circular-chart" viewBox="0 0 36 36">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-fill" strokeDasharray="94, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>

              <div className="cooling-system">
                <div className="fan-container">
                  <div className="fan-blades spin-fast"></div>
                  <div className="fan-center"></div>
                </div>
                <div className="temp-readout">72°C</div>
              </div>
            </div>

            <div className="data-stream-container">
               <div className="data-node"></div>
               <div className="data-node"></div>
               <div className="data-node"></div>
               <div className="stream-line"></div>
            </div>
          </div>

          <div className="home-widget glass-panel">
            <div className="panel-header">
              <HardDrive size={16} className="glow-icon accent-green" />
              <h3>Storage Matrix</h3>
            </div>
            <div className="storage-bars">
               <div className="storage-row">
                 <span>NVMe Cache</span>
                 <div className="mini-bar"><div className="mini-fill" style={{ width: '85%', background: 'var(--accent-primary)' }}></div></div>
               </div>
               <div className="storage-row">
                 <span>Cold Storage</span>
                 <div className="mini-bar"><div className="mini-fill" style={{ width: '42%', background: '#34d399' }}></div></div>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom: Floating Glass Format Icons */}
        <div className="home-format-grid">
          {formats.map((fmt, i) => (
            <div key={i} className="format-cube glass-panel" style={{ '--cube-color': fmt.color, animationDelay: `${i * 0.2}s` }}>
              <div className="cube-ext" style={{ color: fmt.color }}>{fmt.ext}</div>
              <div className="cube-desc">{fmt.desc}</div>
              <div className="cube-glow" style={{ background: fmt.color }}></div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
