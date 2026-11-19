'use client';

import React, { useState, useEffect } from 'react';

// In-memory cache for the session so repeated renders or navigation don't re-query
const actorPhotoCache = new Map<string, string | null>();

interface CastAvatarProps {
  name: string;
  role?: string;
  size?: number;
}

// Generate deterministic initials and pleasing gradient based on name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): { bg: string; text: string } {
  const gradients = [
    { bg: 'linear-gradient(135deg, #1e3a8a, #0f172a)', text: '#93c5fd' },
    { bg: 'linear-gradient(135deg, #3730a3, #1e1b4b)', text: '#c7d2fe' },
    { bg: 'linear-gradient(135deg, #581c87, #2e1065)', text: '#e9d5ff' },
    { bg: 'linear-gradient(135deg, #831843, #500724)', text: '#fbcfe8' },
    { bg: 'linear-gradient(135deg, #14532d, #052e16)', text: '#bbf7d0' },
    { bg: 'linear-gradient(135deg, #713f12, #3b1e08)', text: '#fde68a' },
    { bg: 'linear-gradient(135deg, #1e293b, #0f172a)', text: '#cbd5e1' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function CastAvatar({ name, role = 'Starring', size = 80 }: CastAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(actorPhotoCache.get(name) ?? null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!actorPhotoCache.has(name));

  useEffect(() => {
    if (actorPhotoCache.has(name)) {
      setPhotoUrl(actorPhotoCache.get(name) ?? null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    fetch(`/api/cast/image?name=${encodeURIComponent(name)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        const url = data?.url || null;
        actorPhotoCache.set(name, url);
        setPhotoUrl(url);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        actorPhotoCache.set(name, null);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [name]);

  const initials = getInitials(name);
  const { bg, text } = getAvatarColor(name);

  return (
    <div className="cinejoy-cast-card">
      <div
        className="cinejoy-cast-avatar-box"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          border: '2px solid rgba(255, 255, 255, 0.14)',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s',
          cursor: 'pointer',
        }}
      >
        {photoUrl && !hasError ? (
          <img
            src={photoUrl}
            alt=""
            loading="lazy"
            className="cinejoy-cast-img"
            onError={() => {
              setHasError(true);
              actorPhotoCache.set(name, null);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              display: 'block',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: `${Math.round(size * 0.32)}px`,
              fontWeight: 800,
              color: text,
              letterSpacing: '0.04em',
              userSelect: 'none',
            }}
          >
            {initials}
          </span>
        )}
      </div>

      <div className="cinejoy-cast-name" title={name}>
        {name}
      </div>
      <div className="cinejoy-cast-role">{role}</div>
    </div>
  );
}

export default CastAvatar;
