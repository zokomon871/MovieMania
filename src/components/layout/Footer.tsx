import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { FooterCounter } from './FooterCounter';

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)', padding: '32px 0 40px', marginTop: '60px' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
            MOVIE<span style={{ color: 'var(--accent)' }}>MANIA</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
            Free live IPTV streams & Cinema VOD exploration platform.
          </p>
        </div>

        <FooterCounter />

        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Live TV</Link>
          <Link href="/movies" style={{ color: 'inherit', textDecoration: 'none' }}>VOD Cinema</Link>
          <Link href="/series" style={{ color: 'inherit', textDecoration: 'none' }}>Series</Link>
          <Link href="/favorites" style={{ color: 'inherit', textDecoration: 'none' }}>Bookmarks</Link>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Crafted with <Heart size={14} color="var(--accent)" fill="var(--accent)" /> Next.js
        </div>
      </div>
    </footer>
  );
}

export default Footer;
