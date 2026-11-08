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
}

export function MediaRow({
  title,
  icon,
  items,
  type,
  showRank = false,
  viewAllHref,
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
              <span>View All</span>
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
          <div key={item.id} className="media-shelf-card-wrapper">
            {type === 'movie' ? (
              <MovieCard movie={item as ITMDBMovie} rank={showRank ? idx + 1 : undefined} />
            ) : (
              <SeriesCard series={item as ISeries} rank={showRank ? idx + 1 : undefined} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediaRow;

