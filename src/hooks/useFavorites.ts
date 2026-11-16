import { useState, useEffect, useCallback } from 'react';

export interface IFavoriteItem {
  id: string;
  type: 'movie' | 'series' | 'channel';
  title: string;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number;
  year?: string;
  category?: string;
  addedAt?: number;
}

const STORAGE_KEY_V2 = 'moviemania_favorites_v2';
const STORAGE_KEY_LEGACY = 'moviemania_favorites';

export function useFavorites() {
  const [favoriteItems, setFavoriteItems] = useState<IFavoriteItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const v2Stored = localStorage.getItem(STORAGE_KEY_V2);
      if (v2Stored) {
        const parsed: IFavoriteItem[] = JSON.parse(v2Stored);
        setFavoriteItems(parsed);
        setFavoriteIds(parsed.map((item) => String(item.id)));
      } else {
        // Fallback or migrate from legacy
        const legacyStored = localStorage.getItem(STORAGE_KEY_LEGACY);
        if (legacyStored) {
          const ids: string[] = JSON.parse(legacyStored);
          const migrated: IFavoriteItem[] = ids.map((id) => ({
            id,
            type: id.startsWith('tt') ? 'movie' : 'channel',
            title: id,
            addedAt: Date.now(),
          }));
          setFavoriteItems(migrated);
          setFavoriteIds(ids);
          localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
        }
      }
    } catch (e) {
      console.warn('Failed reading favorites:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveFavorites = useCallback((newItems: IFavoriteItem[]) => {
    setFavoriteItems(newItems);
    const newIds = newItems.map((i) => String(i.id));
    setFavoriteIds(newIds);
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(newItems));
      localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(newIds));
    } catch (err) {
      console.error('Failed saving favorites to localStorage:', err);
    }
  }, []);

  const toggleFavorite = useCallback(
    (itemOrId: string | IFavoriteItem, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      const id = typeof itemOrId === 'string' ? itemOrId : String(itemOrId.id);

      setFavoriteItems((prev) => {
        const exists = prev.some((i) => String(i.id) === id);
        let next: IFavoriteItem[];
        if (exists) {
          next = prev.filter((i) => String(i.id) !== id);
        } else {
          const newItem: IFavoriteItem =
            typeof itemOrId === 'string'
              ? { id, type: id.startsWith('tt') ? 'movie' : 'channel', title: id, addedAt: Date.now() }
              : { ...itemOrId, id, addedAt: Date.now() };
          next = [newItem, ...prev];
        }

        const newIds = next.map((i) => String(i.id));
        setFavoriteIds(newIds);
        try {
          localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
          localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(newIds));
        } catch (err) {
          console.error(err);
        }
        return next;
      });
    },
    []
  );

  const isFavorite = useCallback(
    (id: string | number | undefined) => {
      if (!id) return false;
      return favoriteIds.includes(String(id));
    },
    [favoriteIds]
  );

  return {
    favorites: favoriteIds, // For backwards compatibility with useChannels
    favoriteItems,
    isFavorite,
    toggleFavorite,
    isLoaded,
  };
}
