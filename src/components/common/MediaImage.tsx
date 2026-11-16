'use client';

import React, { useState } from 'react';
import { FALLBACK_POSTER } from '@/lib/mediaUtils';

interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export function MediaImage({
  src,
  alt = '',
  fallbackSrc = FALLBACK_POSTER,
  className = '',
  ...props
}: MediaImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt}
      loading="lazy"
      onError={handleError}
      className={className}
      {...props}
    />
  );
}

export default MediaImage;
