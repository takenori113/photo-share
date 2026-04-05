"use client";

import { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Photo } from "../types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  ".jpeg",
  ".jpg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif",
  ".avif",
];
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type UploadSignatureResponse = {
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  apiKey: string;
  cloudName: string;
};

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 12).join("")}-${hex.slice(12, 16).join("")}`;
}

function isSupportedImageFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function getDropzoneErrorMessage(code: string, file?: File) {
  if (code === "file-too-large") {
    const sizeText = file
      ? `${(file.size / 1024 / 1024).toFixed(1)}MB`
      : "不明";
    return `ファイルサイズが大きすぎます (${sizeText})。10MB以下の画像を選択してください`;
  }
  if (code === "file-invalid-type") {
    return "対応していない画像形式です。JPG/PNG/GIF/WEBP/HEIC/AVIF を選択してください";
  }
  if (code === "too-many-files") {
    return "一度にアップロードできるファイルは1枚です";
  }
  return "選択した画像はアップロードできませんでした";
}

export default function UploadForm({
  onPhotoUploaded,
}: {
  onPhotoUploaded: (photo: Photo) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadToCloudinary = useCallback(
    (file: File, signatureData: UploadSignatureResponse) =>
      new Promise<{ secure_url: string }>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signatureData.apiKey);
        formData.append("timestamp", String(signatureData.timestamp));
        formData.append("signature", signatureData.signature);
        formData.append("folder", signatureData.folder);
        formData.append("public_id", signatureData.publicId);

        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        );

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) {
            return;
          }
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText) as {
              secure_url?: string;
            };
            if (!data.secure_url) {
              reject(new Error("CloudinaryのURL取得に失敗しました"));
              return;
            }
            resolve({ secure_url: data.secure_url });
            return;
          }

          reject(new Error(`Cloudinary upload failed (HTTP ${xhr.status})`));
        };

        xhr.onerror = () => {
          reject(
            new Error(
              "Cloudinaryへのアップロード中にネットワークエラーが発生しました",
            ),
          );
        };

        xhr.send(formData);
      }),
    [],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const firstRejection = fileRejections[0];
        const firstError = firstRejection.errors[0];
        setError(
          getDropzoneErrorMessage(
            firstError?.code || "unknown",
            firstRejection.file,
          ),
        );
        return;
      }

      if (acceptedFiles.length === 0) {
        setError("画像が選択されていません");
        return;
      }

      const file = acceptedFiles[0];

      // 一部モバイル環境では file.type が空になるため拡張子でも判定する
      if (!isSupportedImageFile(file)) {
        setError("画像ファイルのみアップロードできます");
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(
          `ファイルサイズが大きすぎます (${(file.size / 1024 / 1024).toFixed(1)}MB)。10MB以下の画像を選択してください`,
        );
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const id = generateId();

        let signatureResponse: Response | null = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          signatureResponse = await fetch("/api/upload/signature", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              publicId: id,
              folder: "photo-share",
            }),
          });

          if (!RETRYABLE_STATUS_CODES.has(signatureResponse.status)) {
            break;
          }

          if (attempt < 2) {
            await sleep(400 * (attempt + 1));
          }
        }

        if (!signatureResponse) {
          throw new Error("サーバーから応答がありませんでした");
        }

        if (!signatureResponse.ok) {
          if (signatureResponse.status === 503) {
            throw new Error(
              "現在サーバーが一時的に利用できません（503）。少し時間をおいて再試行してください",
            );
          }

          const errorData = await signatureResponse.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `アップロード準備に失敗しました (HTTP ${signatureResponse.status})`,
          );
        }

        const signatureData =
          (await signatureResponse.json()) as UploadSignatureResponse;
        const uploaded = await uploadToCloudinary(file, signatureData);

        const photo: Photo = {
          id,
          filename: file.name,
          path: uploaded.secure_url,
          qrCodeUrl: `/photos/${id}`,
          createdAt: new Date().toISOString(),
        };

        setUploadProgress(100);
        onPhotoUploaded(photo);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "不明なエラーが発生しました",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onPhotoUploaded, uploadToCloudinary],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": ALLOWED_EXTENSIONS,
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700"}
          ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-blue-400 dark:hover:border-blue-600"}`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          {isDragActive ? (
            <p className="text-blue-500 font-medium">
              ここにドロップしてアップロード
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              クリックまたはドラッグ＆ドロップで写真をアップロード
            </p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            JPG, PNG, GIF, WEBP, HEIC, AVIF (最大10MB)
          </p>
        </div>
      </div>

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-center mt-2 text-gray-500">
            アップロード中...
          </p>
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
