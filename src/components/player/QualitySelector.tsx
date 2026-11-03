import React from 'react';
import { Settings, Check } from 'lucide-react';
import { QualityLevel } from '@/hooks/useHlsPlayer';

interface QualitySelectorProps {
  levels: QualityLevel[];
  currentLevel: number;
  activeLabel?: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (index: number) => void;
}

export function QualitySelector({ levels, currentLevel, activeLabel, isOpen, onToggle, onSelect }: QualitySelectorProps) {
  if (levels.length === 0) return null;

  const selectedHeight = levels.find((l) => l.index === currentLevel)?.height ?? 0;
  const badge = currentLevel === -1 ? 'AUTO' : selectedHeight >= 720 ? 'HD' : null;

  return (
    <div className="player-menu-anchor">
      <button
        onClick={onToggle}
        className={`player-ctrl-btn ${isOpen ? 'on' : ''}`}
        data-tip={isOpen ? undefined : 'Quality'}
        aria-expanded={isOpen}
      >
        <Settings size={18} className={isOpen ? 'spin-once' : ''} />
        {badge && <span className="player-ctrl-badge">{badge}</span>}
      </button>

      {isOpen && (
        <div className="player-menu" role="menu">
          <div className="player-menu-title">Quality</div>
          <button
            role="menuitemradio"
            aria-checked={currentLevel === -1}
            className={`player-menu-item ${currentLevel === -1 ? 'selected' : ''}`}
            onClick={() => onSelect(-1)}
          >
            <span className="check">{currentLevel === -1 && <Check size={14} />}</span>
            <span>Auto</span>
            {currentLevel === -1 && activeLabel && <span className="hint">{activeLabel}</span>}
          </button>
          {levels.map((lvl) => (
            <button
              key={lvl.index}
              role="menuitemradio"
              aria-checked={currentLevel === lvl.index}
              className={`player-menu-item ${currentLevel === lvl.index ? 'selected' : ''}`}
              onClick={() => onSelect(lvl.index)}
            >
              <span className="check">{currentLevel === lvl.index && <Check size={14} />}</span>
              <span>{lvl.label}</span>
              {lvl.height >= 720 && <span className="hd-tag">HD</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
