import React, { useState } from 'react';
import GenericView from './GenericView';
import { HelpCircle, Code, BookOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function HelpView({ onBack }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <GenericView 
      title="Help & Support" 
      icon={<HelpCircle size={22} />} 
      description="Official documentation, license details, and developer credits."
      onBack={onBack}
    >
      <div className="settings-view-layout">
        
        {/* Developer Credit */}
        <div className="settings-section-card" style={{ 
          background: 'linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.1), rgba(0,0,0,0))',
          borderLeft: '4px solid var(--accent-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
              <Code size={32} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-main)', letterSpacing: '0.5px' }}>
                Offline Video Studio
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Designed and Created by <strong style={{ color: 'var(--text-main)', fontWeight: '600' }}>A.U.H.D. Samarasingha</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Official Documentation */}
        <div className="settings-section-card">
          <div className="settings-section-title">
            <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Official Documentation (Step-by-Step Guide)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div className="doc-step">
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '13px' }}>1. Add Your Media</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>
                  Drag and drop a video file directly into the application dashboard, or click the "Browse File" button to open your file explorer.
                </p>
             </div>
             
             <div className="doc-step">
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '13px' }}>2. Configure Optimization Settings</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>
                  On the right-side panel, select your target quality (CRF), target file size, and encoding preset. If you have a dedicated graphics card, enable NVIDIA NVENC, Intel QSV, or AMD AMF for significantly faster processing.
                </p>
             </div>

             <div className="doc-step">
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: '13px' }}>3. Compress & Export</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>
                  Click the primary "Compress Video" button. The software will process your file completely offline using a sandboxed FFmpeg engine, ensuring total privacy.
                </p>
             </div>
          </div>
        </div>

        {/* License Information */}
        <div className="settings-section-card">
          <div className="settings-section-title">
            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>License Information & Usage Rights</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 10px 0' }}>
              <strong>Proprietary Freeware License</strong><br />
              This software is provided "as is", without warranty of any kind, express or implied.
              Users are granted a personal, non-exclusive right to use the Offline Video Studio application for both personal and commercial projects.
            </p>
            <p style={{ margin: '0 0 10px 0' }}>
              <strong>Privacy Guarantee</strong><br />
              This application operates strictly in a 100% offline sandbox environment. No video data, metadata, or telemetry is ever transmitted to external servers. Your files remain exclusively on your local machine.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Third-Party Components</strong><br />
              Video processing capabilities are powered by FFmpeg, which is distributed under the LGPL/GPL licenses. The user interface leverages React and Electron.
            </p>
          </div>
        </div>

      </div>
    </GenericView>
  );
}
