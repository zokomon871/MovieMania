import { useEffect } from 'react';

interface ShortcutsProps {
  channel: any;
  showQualityMenu: boolean;
  isMuted: boolean;
  volume: number;
  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  cycleFit: () => void;
  goLive: () => void;
  changeVolume: (v: number) => void;
  goNext: () => void;
  goPrev: () => void;
  onClose?: () => void;
  pokeControls: () => void;
  setShowQualityMenu: (v: boolean) => void;
  setGuideOpen: (updater: (prev: boolean) => boolean) => void;
  flash: (msg: string) => void;
}

export function usePlayerShortcuts({
  channel,
  showQualityMenu,
  isMuted,
  volume,
  togglePlay,
  toggleMute,
  toggleFullscreen,
  cycleFit,
  goLive,
  changeVolume,
  goNext,
  goPrev,
  onClose,
  pokeControls,
  setShowQualityMenu,
  setGuideOpen,
  flash,
}: ShortcutsProps) {
  useEffect(() => {
    if (!channel) return;

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      let handled = false;
      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          togglePlay();
          handled = true;
          break;
        case 'm':
        case 'M':
          toggleMute();
          handled = true;
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          handled = true;
          break;
        case 'a':
        case 'A':
          cycleFit();
          handled = true;
          break;
        case 'g':
        case 'G':
          setGuideOpen((o) => !o);
          handled = true;
          break;
        case 'l':
        case 'L':
          goLive();
          flash('Live');
          handled = true;
          break;
        case 'ArrowUp':
          changeVolume((isMuted ? 0 : volume) + 0.1);
          handled = true;
          break;
        case 'ArrowDown':
          changeVolume((isMuted ? 0 : volume) - 0.1);
          handled = true;
          break;
        case 'n':
        case 'N':
        case 'PageDown':
          goNext();
          handled = true;
          break;
        case 'p':
        case 'P':
        case 'PageUp':
          goPrev();
          handled = true;
          break;
        case 'Escape':
          if (showQualityMenu) setShowQualityMenu(false);
          else if (!document.fullscreenElement) onClose?.();
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        pokeControls();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    channel,
    togglePlay,
    toggleMute,
    toggleFullscreen,
    cycleFit,
    goLive,
    changeVolume,
    goNext,
    goPrev,
    onClose,
    flash,
    pokeControls,
    showQualityMenu,
    isMuted,
    volume,
    setShowQualityMenu,
    setGuideOpen,
  ]);
}

