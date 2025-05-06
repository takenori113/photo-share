'use client';

import { useState } from 'react';
import UploadForm from './components/UploadForm';
import QRCodeDisplay from './components/QRCodeDisplay';
import { Photo } from './types';

export default function Home() {
  const [uploadedPhoto, setUploadedPhoto] = useState<Photo | null>(null);

  const handlePhotoUploaded = (photo: Photo) => {
    setUploadedPhoto(photo);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            写真共有アプリ
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">写真をアップロード</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  写真をアップロードすると、QRコードが発行されます。
                  このQRコードを使って、他の人と写真を共有できます。
                </p>
                <UploadForm onPhotoUploaded={handlePhotoUploaded} />
              </div>
            </div>

            <div className="w-full md:w-1/2">
              {uploadedPhoto ? (
                <QRCodeDisplay photo={uploadedPhoto} />
              ) : (
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 h-full flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    QRコードが表示されます
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                    左側のフォームから写真をアップロードすると、<br />
                    ここにQRコードが表示されます。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} 写真共有アプリ
          </p>
        </div>
      </footer>
    </div>
  );
}
