import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', desc: 'Focus Quick Search bar' },
    { key: 'Space / K', desc: 'Play / Pause' },
    { key: 'M', desc: 'Mute / Unmute audio' },
    { key: '↑ / ↓', desc: 'Volume up / down' },
    { key: 'N / P', desc: 'Next / Previous channel' },
    { key: 'L', desc: 'Jump to live' },
    { key: 'G', desc: 'Show / Hide channel guide' },
    { key: 'F', desc: 'Toggle fullscreen (or double-click video)' },
    { key: 'A', desc: 'Cycle picture size (Fit, Zoom, Stretch)' },
    { key: 'Esc', desc: 'Close video player or popup modal' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-hover)', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
            <Keyboard size={20} color="var(--accent)" />
            Keyboard Shortcuts
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.desc}</span>
              <kbd style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

