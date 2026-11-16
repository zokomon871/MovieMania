import { useState, useEffect, useCallback } from 'react';

export interface IWatchHistoryItem {
  id: string;
  type: 'movie' | 'series';
  title: string;
  poster?: string | null;
  backdrop?: string | null;
  progressPercent: number; // e.g. 15 to 95
  season?: number;
  episode?: number;
  episodeTitle?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'moviemania_watch_history_v2';

export function useWatchHistory() {
  const [history, setHistory] = useState<IWatchHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed reading watch history:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateHistory = useCallback((item: Omit<IWatchHistoryItem, 'updatedAt'>) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      const updated: IWatchHistoryItem = {
        ...item,
        updatedAt: Date.now(),
      };
      const next = [updated, ...filtered].slice(0, 20); // Keep last 20
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed saving watch history:', err);
      }
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return {
    history,
    updateHistory,
    removeFromHistory,
    clearHistory,
    isLoaded,
  };
}
