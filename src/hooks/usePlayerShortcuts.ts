import { useEffect, useRef } from 'react';

interface ShortcutsProps {
  menuOpen: boolean;
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
  setMenuOpen: (v: boolean) => void;
  setGuideOpen: (updater: (prev: boolean) => boolean) => void;
  flash: (msg: string) => void;
}

/**
 * Live player keyboard shortcuts:
 * Space/K play · M mute · ↑/↓ volume · N/P or PageDown/PageUp channel · F fullscreen
 * A picture size · G channel list · L jump to live · Esc close menu / player
 */
export function usePlayerShortcuts(props: ShortcutsProps) {
  // Always read the latest props without re-binding the listener on every render.
  const ref = useRef(props);
  ref.current = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;

      const p = ref.current;
      const vol = p.isMuted ? 0 : p.volume;
      const actions: Record<string, () => void> = {
        ' ': p.togglePlay,
        k: p.togglePlay,
        m: p.toggleMute,
        f: p.toggleFullscreen,
        a: p.cycleFit,
        g: () => p.setGuideOpen((o) => !o),
        l: () => {
          p.goLive();
          p.flash('Live');
        },
        arrowup: () => p.changeVolume(vol + 0.1),
        arrowdown: () => p.changeVolume(vol - 0.1),
        n: p.goNext,
        pagedown: p.goNext,
        p: p.goPrev,
        pageup: p.goPrev,
        escape: () => {
          if (p.menuOpen) p.setMenuOpen(false);
          else if (!document.fullscreenElement) p.onClose?.();
        },
      };

      const action = actions[e.key.toLowerCase()];
      if (!action) return;
      // Let Space/Enter activate a focused button instead of toggling playback.
      if (e.key === ' ' && tag === 'button') return;
      e.preventDefault();
      action();
      p.pokeControls();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
