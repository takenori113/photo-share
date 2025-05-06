'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Photo } from '../types';

export default function UploadForm({ onPhotoUploaded }: { onPhotoUploaded: (photo: Photo) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // 画像ファイルのみを許可
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロードできます');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }
      
      const photo: Photo = await response.json();
      onPhotoUploaded(photo);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsUploading(false);
    }
  }, [onPhotoUploaded]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-600'}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          
          {isDragActive ? (
            <p className="text-blue-500 font-medium">ここにドロップしてアップロード</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              クリックまたはドラッグ＆ドロップで写真をアップロード
            </p>
          )}
          
          <p className="text-xs text-gray-400 dark:text-gray-500">
            JPG, PNG, GIF, WEBP (最大10MB)
          </p>
        </div>
      </div>
      
      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="text-sm text-center mt-2 text-gray-500">アップロード中...</p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}