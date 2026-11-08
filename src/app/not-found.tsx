import React from 'react';
import Link from 'next/link';
import { Film, Home, Tv, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="error-page-container">
      <div className="error-page-card">
        <div className="error-badge">
          <Compass size={15} /> 404 NOT FOUND
        </div>

        <h1 className="error-title">Page Lost in the Stream</h1>

        <p className="error-description">
          The channel, movie, or page you are looking for has concluded its broadcast or moved to another frequency.
        </p>

        <div className="error-actions">
          <Link href="/" className="error-btn-primary">
            <Home size={18} />
            <span>Return to Home</span>
          </Link>
          <Link href="/movies" className="error-btn-secondary">
            <Film size={18} />
            <span>Browse Movies</span>
          </Link>
          <Link href="/series" className="error-btn-secondary">
            <Tv size={18} />
            <span>Browse Series</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

