'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

export interface GalleryImage {
  id: string;
  url: string;
  filename?: string;
  order: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  onReorder: (images: GalleryImage[]) => void;
  onDelete: (imageId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageGallery({
  images,
  onReorder,
  onDelete,
  disabled = false,
  className = '',
}: ImageGalleryProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      if (disabled) return;
      setDraggedId(id);
      e.dataTransfer.effectAllowed = 'move';
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      if (disabled || id === draggedId) return;
      setDragOverId(id);
    },
    [disabled, draggedId]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (disabled || !draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      const draggedIndex = sortedImages.findIndex((img) => img.id === draggedId);
      const targetIndex = sortedImages.findIndex((img) => img.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      // Reorder images
      const newImages = [...sortedImages];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(targetIndex, 0, removed);

      // Update order values
      const reorderedImages = newImages.map((img, index) => ({
        ...img,
        order: index,
      }));

      onReorder(reorderedImages);
      setDraggedId(null);
      setDragOverId(null);
    },
    [disabled, draggedId, sortedImages, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  if (images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>No images uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${className}`}>
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, image.id)}
            onDragOver={(e) => handleDragOver(e, image.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, image.id)}
            onDragEnd={handleDragEnd}
            className={`
              relative group rounded-lg overflow-hidden border-2 transition-all
              ${draggedId === image.id ? 'opacity-50 border-blue-400' : 'border-transparent'}
              ${dragOverId === image.id ? 'border-blue-500 scale-105' : ''}
              ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}
            `}
          >
            {/* Image */}
            <div className="aspect-square relative bg-gray-100">
              <Image
                src={image.url}
                alt={image.filename || `Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                onClick={() => setLightboxImage(image.url)}
              />
            </div>

            {/* Order badge */}
            <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {index + 1}
            </div>

            {/* Drag handle */}
            {!disabled && (
              <div className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
              </div>
            )}

            {/* Delete button */}
            {!disabled && (
              <button
                onClick={() => handleDeleteClick(image.id)}
                className="absolute bottom-2 right-2 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Image</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={lightboxImage}
              alt="Full size image"
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
