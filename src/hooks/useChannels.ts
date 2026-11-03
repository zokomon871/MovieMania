import { useState, useEffect, useCallback } from 'react';
import { IChannel, IChannelListResponse } from '@/lib/types';
import { useDebounce } from './useDebounce';

interface UseChannelsProps {
  category: string;
  country: string;
  search: string;
  favoritesOnly: boolean;
  favorites: string[];
}

export function useChannels({ category, country, search, favoritesOnly, favorites }: UseChannelsProps) {
  const [channels, setChannels] = useState<IChannel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 400);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [category, country, debouncedSearch, favoritesOnly]);

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '36',
        category,
        country,
        search: debouncedSearch,
      });

      if (favoritesOnly) {
        if (favorites.length === 0) {
          setChannels([]);
          setTotal(0);
          setTotalPages(1);
          setIsLoading(false);
          return;
        }
        params.set('favorites', favorites.join(','));
      }

      const res = await fetch(`/api/channels?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch channels');
      const data: IChannelListResponse = await res.json();

      setChannels(data.channels || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('[useChannels] Fetch error:', err);
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, category, country, debouncedSearch, favoritesOnly, favorites]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    refetch: fetchChannels,
  };
}

