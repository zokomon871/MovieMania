'use client';

import React, { useEffect, useState } from 'react';
import { Film, Tv, Database } from 'lucide-react';

interface Stats {
  movies: number;
  series: number;
}

export function FooterCounter() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.movies > 0 || data.series > 0)) {
          setStats(data);
        }
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="footer-db-counter">
      <span className="footer-db-indicator">
        <Database size={12} />
      </span>
      <span className="footer-db-stat">
        <Film size={11} /> {stats.movies.toLocaleString()} Movies
      </span>
      <span className="footer-db-divider">/</span>
      <span className="footer-db-stat">
        <Tv size={11} /> {stats.series.toLocaleString()} Series
      </span>
    </div>
  );
}

export default FooterCounter;

