import React from 'react';
import { 
  Home, Zap, Layers, RefreshCw, 
  Bot, Maximize, Scissors, Video,
  Music, FileText, Bookmark, 
  Clock, Download, Cloud, 
  Settings, HelpCircle, Activity
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuGroups = [
    {
      title: "Core",
      items: [
        { id: 'dashboard', label: 'Home', icon: <Home size={16} /> },
        { id: 'compressor', label: 'Compress Video', icon: <Zap size={16} /> },
        { id: 'batch', label: 'Batch Compress', icon: <Layers size={16} /> },
        { id: 'converter', label: 'Convert Format', icon: <RefreshCw size={16} /> },
      ]
    },
    {
      title: "Editing & Tools",
      items: [
        { id: 'recorder', label: 'Screen Recorder', icon: <Video size={16} /> },
        { id: 'mp3', label: 'MP3 Converter', icon: <Music size={16} /> },
        { id: 'resize', label: 'Resize Video', icon: <Maximize size={16} /> }
      ]
    },
    {
      title: "Subtitles",
      items: [
        { id: 'subs', label: 'Subtitles', icon: <FileText size={16} /> },
      ]
    },
    {
      title: "Library",
      items: [
        { id: 'presets', label: 'Presets', icon: <Bookmark size={16} /> },
        { id: 'recent', label: 'Recent Files', icon: <Clock size={16} /> },
        { id: 'downloads', label: 'Downloads/Exports', icon: <Download size={16} /> },
        { id: 'cloud', label: 'Cloud Storage', icon: <Cloud size={16} /> },
      ]
    },
    {
      title: "System",
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
        { id: 'help', label: 'Help & Support', icon: <HelpCircle size={16} /> },
      ]
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <Activity size={18} style={{ marginRight: '6px', color: 'var(--accent-primary)' }} /> <span>OFFLINE</span> STUDIO
      </div>

      <div className="sidebar-scrollable">
        {menuGroups.map((group, gIndex) => (
          <div key={gIndex} className="sidebar-group">
            <div className="sidebar-group-title">{group.title}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Creator Profile Badge */}
      <div className="sidebar-creator-badge">
        <div className="creator-avatar-container">
          <div className="creator-avatar">
            <span>A</span>
          </div>
          <div className="creator-glow-ring"></div>
        </div>
        <div className="creator-info">
          <span className="creator-name">A.U.H.D.S.</span>
          <span className="creator-role">Lead Architect</span>
        </div>
      </div>
    </div>
  );
}
