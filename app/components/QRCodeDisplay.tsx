'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Photo } from '../types';

export default function QRCodeDisplay({ photo }: { photo: Photo }) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/photos/${photo.id}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err);
    }
  };
  
  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${photo.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };
  
  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">写真の共有QRコード</h3>
      
      <div className="bg-white p-4 rounded-lg mb-4">
        <QRCode
          id="qr-code"
          value={shareUrl}
          size={200}
          level="H"
        />
      </div>
      
      <div className="w-full mb-4">
        <p className="text-sm text-gray-500 mb-2">共有リンク:</p>
        <div className="flex">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 p-2 text-sm border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={copyToClipboard}
            className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
          >
            {copied ? '✓ コピー済み' : 'コピー'}
          </button>
        </div>
      </div>
      
      <button
        onClick={downloadQRCode}
        className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        QRコードをダウンロード
      </button>
      
      <p className="mt-4 text-xs text-gray-500 text-center">
        このQRコードをスキャンすると、写真を直接閲覧できます。
      </p>
    </div>
  );
}