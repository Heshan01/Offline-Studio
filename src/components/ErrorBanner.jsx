import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorBanner({ error }) {
  return (
    <div className="error-banner">
      <div className="error-banner-title">
        <AlertTriangle size={14} /> Processing Error
      </div>
      <div>{error}</div>
    </div>
  );
}
