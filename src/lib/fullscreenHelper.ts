'use client';

export async function enterFullscreenLandscape(element: HTMLElement | null): Promise<void> {
  if (!element) return;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  } catch (err) {
    console.warn('[Fullscreen] Request failed:', err);
  }

  // Lock screen orientation to landscape on mobile devices
  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
    } else if ((window.screen as any)?.lockOrientation) {
      (window.screen as any).lockOrientation('landscape');
    }
  } catch (err) {
    // Orientation lock may fail if not supported or denied by OS (e.g. iOS Safari)
    console.debug('[Fullscreen] Orientation lock unavailable or denied:', err);
  }
}

export async function exitFullscreenPortrait(): Promise<void> {
  try {
    const orientation = window.screen?.orientation;
    if (orientation && typeof orientation.unlock === 'function') {
      orientation.unlock();
    } else if ((window.screen as any)?.unlockOrientation) {
      (window.screen as any).unlockOrientation();
    }
  } catch (err) {
    console.debug('[Fullscreen] Orientation unlock error:', err);
  }

  try {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    }
  } catch (err) {
    console.warn('[Fullscreen] Exit failed:', err);
  }
}

export function isCurrentlyFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
}
