import React from 'react';

export default function GlobalLoading() {
  return (
    <div
      style={{
        minHeight: '80vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {/* Top Thin Glowing Progress Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #e50914, #ff3b30, #e50914)',
          zIndex: 9999,
          boxShadow: '0 0 12px rgba(229, 9, 20, 0.8)',
          animation: 'shimmer 1s infinite linear',
        }}
      />

      {/* Sleek Cinematic Pulse Spinner */}
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: '3px solid rgba(229, 9, 20, 0.15)',
          borderTopColor: '#e50914',
          animation: 'spin 0.75s infinite linear',
        }}
      />
      <span
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        Loading stream...
      </span>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
