// Image upload configuration

export const UPLOAD_CONFIG = {
  // Maximum file size in bytes (10MB)
  maxFileSize: 10 * 1024 * 1024,

  // Allowed MIME types
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,

  // WebP conversion settings
  webp: {
    quality: 85,
    effort: 4, // 0-6, higher = smaller file but slower
  },

  // Maximum dimensions (will be resized if larger)
  maxDimensions: {
    width: 2400,
    height: 2400,
  },

  // Thumbnail settings
  thumbnail: {
    width: 400,
    height: 400,
  },

  // Storage paths
  paths: {
    uploads: 'public/uploads',
    buildings: 'public/uploads/buildings',
    roomTypes: 'public/uploads/room-types',
  },
} as const;

export type AllowedMimeType = (typeof UPLOAD_CONFIG.allowedMimeTypes)[number];

// Get the public URL path from a storage path
export function getPublicUrl(storagePath: string): string {
  // Remove 'public' prefix for public URL
  return storagePath.replace(/^public/, '');
}

// Get the storage path from a public URL
export function getStoragePath(publicUrl: string): string {
  // Add 'public' prefix for storage path
  if (publicUrl.startsWith('/')) {
    return `public${publicUrl}`;
  }
  return `public/${publicUrl}`;
}
