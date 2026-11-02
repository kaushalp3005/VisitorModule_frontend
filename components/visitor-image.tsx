'use client';

import { useEffect, useState } from 'react';

// The API signs a new S3 link on every response, so the query string changes even
// when the photo doesn't. Compare without it so polling doesn't reload the photo.
const withoutSignature = (url: string | undefined) => url?.split('?')[0];

function useVisitorImage(src: string | undefined) {
  const [imageUrl, setImageUrl] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const samePhoto = withoutSignature(src) === withoutSignature(imageUrl);
    // Keep the link on screen, but give a failed photo another try with the newer link.
    if (samePhoto && !imageError) return;

    setImageUrl(src);
    if (!samePhoto) {
      setImageError(false);
      setImageLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return {
    imageUrl,
    imageError,
    imageLoading,
    handleLoad: () => {
      setImageError(false);
      setImageLoading(false);
    },
    handleError: () => {
      setImageError(true);
      setImageLoading(false);
    },
  };
}

interface VisitorImageProps {
  src: string | undefined;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function VisitorImage({ src, alt, size = 'medium', className = '' }: VisitorImageProps) {
  const { imageUrl, imageError, imageLoading, handleLoad, handleError } = useVisitorImage(src);

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
        {imageUrl && <img src={imageUrl} alt="" hidden onLoad={handleLoad} onError={handleError} />}
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
        onLoad={handleLoad}
        onError={handleError}
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
  const { imageUrl, imageError, imageLoading, handleLoad, handleError } = useVisitorImage(src);

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
        {imageUrl && <img src={imageUrl} alt="" hidden onLoad={handleLoad} onError={handleError} />}
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
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
