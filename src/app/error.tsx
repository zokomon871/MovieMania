'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error caught by boundary:', error);
  }, [error]);

  return (
    <div className="error-page-container">
      <div className="error-page-card">
        <div className="error-badge error-badge-danger">
          <AlertTriangle size={15} /> 500 BROADCAST ERROR
        </div>

        <h1 className="error-title">Signal Interrupted</h1>

        <p className="error-description">
          An unexpected error occurred while loading this broadcast stream. You can try refreshing the connection or return home.
        </p>

        <div className="error-actions">
          <button onClick={() => reset()} className="error-btn-primary">
            <RotateCcw size={18} />
            <span>Retry Connection</span>
          </button>
          <Link href="/" className="error-btn-secondary">
            <Home size={18} />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

