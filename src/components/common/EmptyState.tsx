import React from 'react';
import { Tv, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export function EmptyState({
  title = 'No channels found',
  message = 'Try adjusting your search criteria, clearing filters, or browsing other categories.',
  onReset,
}: EmptyStateProps) {
  return (
    <div className="empty-state-card" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', margin: '40px 0' }}>
      <div style={{ display: 'inline-flex', padding: '20px', background: 'var(--accent-muted)', borderRadius: '50%', color: 'var(--accent)', marginBottom: '16px' }}>
        <Tv size={36} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
        {message}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Reset All Filters
        </button>
      )}
    </div>
  );
}

