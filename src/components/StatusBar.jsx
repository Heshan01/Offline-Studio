import React, { useState, useEffect } from 'react';

export default function StatusBar({ status, progress, eta }) {
  const [stats, setStats] = useState({ cpuUsage: 0, ramUsagePercent: 0, freeMemGb: 0 });

  useEffect(() => {
    let interval;
    if (window.electronAPI?.getSystemStats) {
      interval = setInterval(async () => {
        const sysStats = await window.electronAPI.getSystemStats();
        if (sysStats) setStats(sysStats);
      }, 2000); // Poll every 2 seconds
    }
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          <strong>Status:</strong> {status === 'idle' ? 'Idle' : status === 'ready' ? 'Ready to Compress' : status === 'compressing' ? 'Processing...' : 'Completed'}
        </span>
        {status === 'compressing' && (
          <>
            <span className="status-item"><strong>Progress:</strong> {progress}%</span>
            <span className="status-item"><strong>ETA:</strong> {eta || 'Calculating...'}</span>
          </>
        )}
      </div>

      <div className="status-right">
        <span className="status-item"><strong>CPU:</strong> {stats.cpuUsage}%</span>
        <span className="status-item"><strong>RAM:</strong> {stats.ramUsagePercent}% ({stats.freeMemGb} GB free)</span>
        <span className="status-item"><strong>Queue:</strong> 0 pending</span>
      </div>
    </div>
  );
}
