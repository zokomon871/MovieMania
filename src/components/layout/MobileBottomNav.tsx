'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Layers, Tv, Star } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const isMovies = pathname.startsWith('/movies');
  const isSeries = pathname.startsWith('/series');
  const isFavorites = pathname.startsWith('/favorites');
  const isHome = pathname === '/';

  const navItems = [
    { href: '/', label: 'Home', icon: Home, active: isHome },
    { href: '/movies', label: 'Movies', icon: Film, active: isMovies },
    { href: '/series', label: 'Series', icon: Layers, active: isSeries },
    { href: '/#live-directory', label: 'Live TV', icon: Tv, active: false },
    { href: '/favorites', label: 'My List', icon: Star, active: isFavorites },
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={20} />
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;

