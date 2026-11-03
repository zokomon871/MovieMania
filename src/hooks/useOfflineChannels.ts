import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'moviemania_offline_channels';

export function useOfflineChannels() {
  const [offlineChannels, setOfflineChannels] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOfflineChannels(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed reading offline channels:', e);
    }
  }, []);

  const markOffline = useCallback((channelId: string) => {
    setOfflineChannels((prev) => {
      if (prev.includes(channelId)) return prev;
      const next = [...prev, channelId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  }, []);

  const markOnline = useCallback((channelId: string) => {
    setOfflineChannels((prev) => {
      if (!prev.includes(channelId)) return prev;
      const next = prev.filter((id) => id !== channelId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  }, []);

  return { offlineChannels, markOffline, markOnline };
}

