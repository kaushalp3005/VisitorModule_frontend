'use client';

import { useState } from 'react';

interface VisitorImageProps {
  src: string | undefined;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function VisitorImage({ src, alt, size = 'medium', className = '' }: VisitorImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const imageUrl = src;

  if (!imageUrl || imageError) {
    const sizeClasses = {
      small: 'w-12 h-12',
      medium: 'w-48 h-48',
      large: 'w-64 h-64',
    };

    return (
      <div
        className={`${sizeClasses[size]} ${className} bg-muted rounded-lg border-2 border-border flex items-center justify-center`}
      >
        <svg
          className={`${size === 'small' ? 'h-6 w-6' : size === 'medium' ? 'h-24 w-24' : 'h-32 w-32'} text-muted-foreground`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {imageLoading && (
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-muted rounded-lg border-2 border-border flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${sizeClasses[size]} object-cover rounded-lg border-2 border-border ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
}

interface VisitorThumbnailProps {
  src: string | undefined;
  alt: string;
  className?: string;
}

export function VisitorThumbnail({ src, alt, className = '' }: VisitorThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const imageUrl = src;

  if (!imageUrl || imageError) {
    return (
      <div className={`w-12 h-12 ${className} bg-muted rounded-full border-2 border-border flex items-center justify-center flex-shrink-0`}>
        <svg className="h-6 w-6 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      {imageLoading && (
        <div className="absolute inset-0 w-12 h-12 bg-muted rounded-full border-2 border-border flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`w-12 h-12 object-cover rounded-full border-2 border-border ${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
}
