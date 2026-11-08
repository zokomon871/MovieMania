'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ITMDBMovie, ISeries } from '@/lib/types';
import { MovieCard } from '@/components/movies/MovieCard';
import { SeriesCard } from '@/components/series/SeriesCard';

interface MediaRowProps {
  title: string;
  icon?: React.ReactNode;
  items: (ITMDBMovie | ISeries)[];
  type: 'movie' | 'series';
  showRank?: boolean;
  viewAllHref?: string;
  onSelectMedia?: (item: ITMDBMovie | ISeries) => void;
}

export function MediaRow({
  title,
  icon,
  items,
  type,
  showRank = false,
  viewAllHref,
  onSelectMedia,
}: MediaRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
  };

  useEffect(() => {
    checkScroll();
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="media-shelf-section">
      <div className="media-shelf-header">
        <div className="media-shelf-title-box">
          {icon}
          <h2 className="media-shelf-title">{title}</h2>
        </div>

        <div className="media-shelf-actions">
          {viewAllHref && (
            <Link href={viewAllHref} className="media-shelf-view-all">
              <span>Explore All</span>
              <ArrowRight size={14} />
            </Link>
          )}

          <div className="media-shelf-nav-arrows">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className="shelf-nav-btn"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className="shelf-nav-btn"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="media-shelf-carousel"
      >
        {items.map((item, idx) => (
          <div key={item.id} className={showRank ? 'top10-card-wrapper' : 'media-shelf-card-wrapper'}>
            {showRank && <span className="top10-rank-number">{idx + 1}</span>}
            <div className={showRank ? 'top10-poster-box' : undefined}>
              {type === 'movie' ? (
                <MovieCard
                  movie={item as ITMDBMovie}
                  onSelect={onSelectMedia ? () => onSelectMedia(item) : undefined}
                />
              ) : (
                <SeriesCard
                  series={item as ISeries}
                  onSelect={onSelectMedia ? () => onSelectMedia(item) : undefined}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediaRow;
