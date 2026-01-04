'use client';

import { useState, useRef, useCallback } from 'react';
import { UPLOAD_CONFIG } from '@/lib/upload/config';

interface UploadedImage {
  url: string;
  filename: string;
  originalName: string;
}

interface ImageUploaderProps {
  onUpload: (image: UploadedImage) => void;
  onError?: (error: string) => void;
  directory?: string;
  prefix?: string;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
}

export function ImageUploader({
  onUpload,
  onError,
  directory,
  prefix,
  disabled = false,
  className = '',
  multiple = true,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (disabled || isUploading) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsUploading(true);
      const initialProgress: Record<string, number> = {};
      fileArray.forEach((file) => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);

      for (const file of fileArray) {
        try {
          // Validate file type
          if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type as never)) {
            onError?.(`${file.name}: Invalid file type`);
            continue;
          }

          // Validate file size
          if (file.size > UPLOAD_CONFIG.maxFileSize) {
            onError?.(`${file.name}: File too large (max ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB)`);
            continue;
          }

          // Create form data
          const formData = new FormData();
          formData.append('file', file);
          if (directory) formData.append('directory', directory);
          if (prefix) formData.append('prefix', prefix);

          // Upload with progress simulation
          setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }));

          const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
          });

          setUploadProgress((prev) => ({ ...prev, [file.name]: 90 }));

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
          }

          const result = await response.json();
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

          onUpload({
            url: result.data.url,
            filename: result.data.filename,
            originalName: result.data.originalName,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Upload failed';
          onError?.(`${file.name}: ${message}`);
        }
      }

      setIsUploading(false);
      setUploadProgress({});
    },
    [disabled, isUploading, directory, prefix, onUpload, onError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input value to allow uploading the same file again
      e.target.value = '';
    },
    [handleFiles]
  );

  const uploadingFiles = Object.entries(uploadProgress);

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={UPLOAD_CONFIG.allowedMimeTypes.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <svg
                className="w-10 h-10 text-blue-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-gray-600">Uploading...</span>
            </>
          ) : (
            <>
              <svg
                className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Drop images here or click to upload
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, WebP, GIF (max {UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB each)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadingFiles.map(([fileName, progress]) => (
            <div key={fileName} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="truncate max-w-[200px]">{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
