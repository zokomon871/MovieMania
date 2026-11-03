import React from 'react';
import { Scan } from 'lucide-react';

interface AspectRatioToggleProps {
  fit: 'contain' | 'cover' | 'fill';
  label: string;
  onCycle: () => void;
}

export function AspectRatioToggle({ fit, label, onCycle }: AspectRatioToggleProps) {
  return (
    <button
      onClick={onCycle}
      className={`player-ctrl-btn with-label ${fit !== 'contain' ? 'on' : ''}`}
      data-tip="Picture size (A)"
    >
      <Scan size={17} />
      <span className="player-ctrl-label">{label}</span>
    </button>
  );
}
