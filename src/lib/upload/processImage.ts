import sharp from 'sharp';
import { put, del } from '@vercel/blob';
import { UPLOAD_CONFIG } from './config';

interface ProcessedImage {
  url: string;
  filename: string;
  originalName: string;
  width: number;
  height: number;
  size: number;
}

interface ProcessImageOptions {
  file: File;
  directory: string;
  prefix?: string;
}

// Validate file type using magic bytes
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  'image/gif': [0x47, 0x49, 0x46], // GIF
};

async function validateFileType(buffer: Buffer): Promise<string | null> {
  for (const [mimeType, bytes] of Object.entries(MAGIC_BYTES)) {
    const matches = bytes.every((byte, index) => buffer[index] === byte);
    if (matches) {
      // Additional check for WebP (RIFF...WEBP)
      if (mimeType === 'image/webp') {
        const webpSignature = buffer.slice(8, 12).toString('ascii');
        if (webpSignature !== 'WEBP') continue;
      }
      return mimeType;
    }
  }
  return null;
}

// Generate a unique filename with path prefix for organization
function generateFilename(originalName: string, directory: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const baseName = safeName.replace(/\.[^.]+$/, '');
  const prefixStr = prefix ? `${prefix}-` : '';

  // Clean up directory path for blob storage
  const cleanDirectory = directory
    .replace(/^public\//, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');

  return `${cleanDirectory}/${prefixStr}${baseName}-${timestamp}-${random}.webp`;
}

export async function processImage(options: ProcessImageOptions): Promise<ProcessedImage> {
  const { file, directory, prefix } = options;

  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    throw new Error(`File too large. Maximum size is ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB`);
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate file type using magic bytes
  const detectedType = await validateFileType(buffer);
  if (!detectedType) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  // Generate filename with path
  const filename = generateFilename(file.name, directory, prefix);

  // Process image with sharp
  let sharpInstance = sharp(buffer);

  // Get original metadata
  const metadata = await sharpInstance.metadata();

  // Resize if needed (maintaining aspect ratio)
  const { maxDimensions } = UPLOAD_CONFIG;
  if (
    (metadata.width && metadata.width > maxDimensions.width) ||
    (metadata.height && metadata.height > maxDimensions.height)
  ) {
    sharpInstance = sharpInstance.resize(maxDimensions.width, maxDimensions.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to WebP
  const webpBuffer = await sharpInstance
    .webp({
      quality: UPLOAD_CONFIG.webp.quality,
      effort: UPLOAD_CONFIG.webp.effort,
    })
    .toBuffer();

  // Get final dimensions
  const finalMetadata = await sharp(webpBuffer).metadata();

  // Upload to Vercel Blob
  const blob = await put(filename, webpBuffer, {
    access: 'public',
    contentType: 'image/webp',
  });

  return {
    url: blob.url,
    filename: filename.split('/').pop() || filename,
    originalName: file.name,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
    size: webpBuffer.length,
  };
}

export async function deleteImage(url: string): Promise<void> {
  try {
    // Only delete if it's a Vercel Blob URL
    if (url.includes('.blob.vercel-storage.com') || url.includes('.public.blob.vercel-storage.com')) {
      await del(url);
    } else {
      // Legacy: Handle local file deletion for existing images
      const { unlink } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const path = await import('path');
      const storagePath = path.join(process.cwd(), 'public', url);

      if (existsSync(storagePath)) {
        await unlink(storagePath);
      }
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    // Don't throw - file might already be deleted
  }
}
