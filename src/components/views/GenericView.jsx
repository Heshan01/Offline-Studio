import React from 'react';

export default function GenericView({ title, icon, description, onBack, children }) {
  return (
    <div className="home-cosmic-wrapper expanded generic-view-container">
      
      {/* View Header with Back Button */}
      <div className="home-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="home-title-glow" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {typeof icon === 'string' ? (
             <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>{icon}</span>
          ) : (
             <span className="glow-icon accent-blue" style={{ display: 'flex' }}>{icon}</span>
          )}
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '24px' }}>{title}</h1>
            <p style={{ margin: '4px 0 0 0' }}>{description}</p>
          </div>
        </div>
        <button className="qa-button generic-back-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px' }}>
          ⬅ Back to Home
        </button>
      </div>

      {/* Main Content Area */}
      <div className="generic-content-area glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children || (
          <div className="generic-construction-placeholder" style={{ margin: 'auto', textAlign: 'center', opacity: 0.5 }}>
            <div className="construction-icon" style={{ fontSize: '48px', filter: 'grayscale(1)', marginBottom: '16px' }}>🚧</div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '18px', margin: '0 0 8px 0' }}>Module Under Construction</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>This advanced feature requires cloud API keys or native OS integrations that have not yet been configured in Phase 2.</p>
          </div>
        )}
      </div>

    </div>
  );
}
