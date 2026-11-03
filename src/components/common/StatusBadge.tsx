import React from 'react';

interface StatusBadgeProps {
  isOffline: boolean;
  isVerified: boolean;
  quality?: string;
}

export function StatusBadge({ isOffline, isVerified, quality }: StatusBadgeProps) {
  if (isOffline) {
    return (
      <span className="badge badge-offline" title="Broadcast feed is offline or not working">
        <span className="pulse-dot-red" />
        OFFLINE
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {isVerified ? (
        <span
          className="badge"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}
          title="Verified High Reliability Broadcast Stream"
        >
          <span className="pulse-dot" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          24/7 LIVE
        </span>
      ) : (
        <span
          className="badge"
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
          title="Community Broadcast Feed"
        >
          <span className="pulse-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
          COMMUNITY
        </span>
      )}
      {quality && <span className="badge badge-quality">{quality}</span>}
    </div>
  );
}

