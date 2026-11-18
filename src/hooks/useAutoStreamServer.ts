'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VODServer, getMovieStreamUrls, getSeriesStreamUrls } from '@/lib/mediaUtils';

export type ServerMode = 'auto' | VODServer;

const SERVER_ORDER: VODServer[] = ['modiplay', 'iqsmart', 'vidsrc', 'vidlink', 'cinesrc'];

interface UseAutoStreamServerProps {
  type: 'movie' | 'series';
  id: string | number;
  tmdbId?: string | number;
  season?: number;
  episode?: number;
}

export function useAutoStreamServer({
  type,
  id,
  tmdbId,
  season = 1,
  episode = 1,
}: UseAutoStreamServerProps) {
  const [selectedMode, setSelectedMode] = useState<ServerMode>('auto');
  const [activeServer, setActiveServer] = useState<VODServer>('modiplay');
  const [failedServers, setFailedServers] = useState<Set<VODServer>>(new Set());
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);
  const [isVerifiedPlaying, setIsVerifiedPlaying] = useState(false);
  const failoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute all available stream URLs
  const streamUrls: Record<VODServer, string> =
    type === 'series'
      ? getSeriesStreamUrls(String(id), season, episode, tmdbId)
      : getMovieStreamUrls(id, tmdbId);

  // Load user saved server preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('moviemania_vod_server');
      if (saved === 'auto' || saved === 'vidsrc' || saved === 'vidlink' || saved === 'cinesrc' || saved === 'modiplay' || saved === 'iqsmart') {
        setSelectedMode(saved as ServerMode);
        if (saved !== 'auto') {
          setActiveServer(saved as VODServer);
        }
      }
    } catch {}
  }, []);

  // Background health check when in auto mode or when media changes
  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    // Reset failed servers on title change
    setFailedServers(new Set());
    setIsVerifiedPlaying(false);

    if (selectedMode === 'auto') {
      const controller = new AbortController();

      const queryParams = new URLSearchParams({
        id: String(id),
        type,
        ...(tmdbId ? { tmdbId: String(tmdbId) } : {}),
        ...(type === 'series' ? { season: String(season), episode: String(episode) } : {}),
      });

      fetch(`/api/stream/check?${queryParams.toString()}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isCancelled || !data) return;
          if (data.bestServer && data.bestServer !== activeServer) {
            setSwitchMessage(`Auto-selected fastest server: ${data.bestServer.toUpperCase()}`);
            setActiveServer(data.bestServer);
            setTimeout(() => setSwitchMessage(null), 3000);
          }
        })
        .catch(() => {
          // Fallback gracefully to default
        });

      return () => {
        isCancelled = true;
        controller.abort();
      };
    }
  }, [id, type, season, episode, tmdbId, selectedMode]);

  // Failover to next server
  const failoverToNext = useCallback(
    (reason?: string) => {
      setFailedServers((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(activeServer);

        // Find next server in pool not in failed set
        const candidate = SERVER_ORDER.find((s) => !nextSet.has(s));
        if (candidate) {
          setIsSwitching(true);
          const msg = reason || `Server issue: Auto-switching to ${candidate.toUpperCase()}...`;
          setSwitchMessage(msg);
          setActiveServer(candidate);

          setTimeout(() => {
            setIsSwitching(false);
            setTimeout(() => setSwitchMessage(null), 3000);
          }, 800);
        } else {
          // All servers attempted, reset cycle to give another try
          nextSet.clear();
          const next =
            activeServer === 'modiplay'
              ? 'iqsmart'
              : activeServer === 'iqsmart'
              ? 'vidsrc'
              : activeServer === 'vidsrc'
              ? 'vidlink'
              : activeServer === 'vidlink'
              ? 'cinesrc'
              : 'modiplay';
          setActiveServer(next);
          setSwitchMessage('Retrying available stream sources...');
          setTimeout(() => setSwitchMessage(null), 3000);
        }

        return nextSet;
      });
    },
    [activeServer]
  );

  // Auto-failover watchdog: if iframe doesn't play or load within 8s in auto mode
  useEffect(() => {
    if (selectedMode !== 'auto' || isVerifiedPlaying) return;

    if (failoverTimeoutRef.current) {
      clearTimeout(failoverTimeoutRef.current);
    }

    failoverTimeoutRef.current = setTimeout(() => {
      if (!isVerifiedPlaying) {
        failoverToNext(`${activeServer.toUpperCase()} took too long. Auto-switching to next mirror...`);
      }
    }, 9000);

    return () => {
      if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
    };
  }, [activeServer, selectedMode, isVerifiedPlaying, failoverToNext]);

  // Listen to postMessage from embeds (e.g. vidlink sends events)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'PLAYER_EVENT' || data?.event === 'ready' || data?.event === 'play' || data?.type === 'vidlink_timeupdate') {
          setIsVerifiedPlaying(true);
          if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSelectMode = (mode: ServerMode) => {
    setSelectedMode(mode);
    try {
      localStorage.setItem('moviemania_vod_server', mode);
    } catch {}

    if (mode === 'auto') {
      // Revert to first operational or best server
      setFailedServers(new Set());
      setSwitchMessage('Switched to Auto Detection');
      setTimeout(() => setSwitchMessage(null), 2500);
    } else {
      setActiveServer(mode);
      setIsVerifiedPlaying(false);
      setSwitchMessage(`Manual server: ${mode.toUpperCase()}`);
      setTimeout(() => setSwitchMessage(null), 2500);
    }
  };

  const handleNextServer = () => {
    const currentIndex = SERVER_ORDER.indexOf(activeServer);
    const nextIndex = (currentIndex + 1) % SERVER_ORDER.length;
    const nextServer = SERVER_ORDER[nextIndex];
    setActiveServer(nextServer);
    setSwitchMessage(`Switched to ${nextServer.toUpperCase()}`);
    setTimeout(() => setSwitchMessage(null), 2500);
  };

  const markServerLoaded = () => {
    setIsVerifiedPlaying(true);
    if (failoverTimeoutRef.current) {
      clearTimeout(failoverTimeoutRef.current);
    }
  };

  const markServerError = () => {
    failoverToNext(`${activeServer.toUpperCase()} failed to load. Auto-switching...`);
  };

  return {
    selectedMode,
    activeServer,
    activeUrl: streamUrls[activeServer],
    streamUrls,
    isSwitching,
    switchMessage,
    isVerifiedPlaying,
    handleSelectMode,
    handleNextServer,
    markServerLoaded,
    markServerError,
    failoverToNext,
  };
}
