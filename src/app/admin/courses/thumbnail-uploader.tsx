'use client';

import { useRef, useState } from 'react';

import styles from './media-uploader.module.css';

type UploadResponse = {
  objectKey?: string;
  publicUrl?: string;
  uploadUrl?: string;
  error?: string;
};

type MediaUploaderProps = {
  accept: string;
  buttonLabel: string;
  description: string;
  emptyLabel: string;
  initialObjectKey?: string | null;
  initialUrl?: string | null;
  kind: 'thumbnail' | 'video';
  label: string;
  objectKeyName?: string;
  preview: 'image' | 'video';
  urlName: string;
};

type ThumbnailUploaderProps = {
  description: string;
  imageIdName?: string;
  initialImageId?: string | null;
  initialImageUrl?: string | null;
  label: string;
  urlName?: string;
};

type VideoUploaderProps = {
  description: string;
  initialVideoUrl?: string | null;
  label: string;
  urlName?: string;
};

export function ThumbnailUploader({
  description,
  imageIdName = 'thumbnailImageId',
  initialImageId = '',
  initialImageUrl = '',
  label,
  urlName = 'thumbnailUrl',
}: ThumbnailUploaderProps) {
  return (
    <MediaUploader
      accept="image/*"
      buttonLabel="이미지 선택"
      description={description}
      emptyLabel="등록된 썸네일이 없어요."
      initialObjectKey={initialImageId}
      initialUrl={initialImageUrl}
      kind="thumbnail"
      label={label}
      objectKeyName={imageIdName}
      preview="image"
      urlName={urlName}
    />
  );
}

export function VideoUploader({
  description,
  initialVideoUrl = '',
  label,
  urlName = 'videoUrl',
}: VideoUploaderProps) {
  return (
    <MediaUploader
      accept="video/mp4,video/webm"
      buttonLabel="영상 선택"
      description={description}
      emptyLabel="등록된 영상이 없어요."
      initialUrl={initialVideoUrl}
      kind="video"
      label={label}
      preview="video"
      urlName={urlName}
    />
  );
}

function MediaUploader({
  accept,
  buttonLabel,
  description,
  emptyLabel,
  initialObjectKey = '',
  initialUrl = '',
  kind,
  label,
  objectKeyName,
  preview,
  urlName,
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [objectKey, setObjectKey] = useState(initialObjectKey ?? '');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setMessage('업로드 URL을 준비하고 있어요.');

    try {
      const presignedUploadResponse = await fetch('/admin/uploads/r2', {
        body: JSON.stringify({
          contentType: file.type,
          fileName: file.name,
          kind,
          size: file.size,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const presignedUploadPayload =
        (await presignedUploadResponse.json()) as UploadResponse;

      if (
        !presignedUploadResponse.ok ||
        !presignedUploadPayload.uploadUrl ||
        !presignedUploadPayload.objectKey ||
        !presignedUploadPayload.publicUrl
      ) {
        throw new Error(
          presignedUploadPayload.error ?? '업로드 URL을 만들지 못했어요.',
        );
      }

      setMessage('파일을 업로드하고 있어요.');
      const uploadResponse = await fetch(presignedUploadPayload.uploadUrl, {
        body: file,
        headers: {
          'Content-Type': file.type,
        },
        method: 'PUT',
      });

      if (!uploadResponse.ok) {
        throw new Error('Cloudflare R2 업로드에 실패했어요.');
      }

      setObjectKey(presignedUploadPayload.objectKey);
      setUrl(presignedUploadPayload.publicUrl);
      setMessage('업로드 완료. 저장 버튼을 눌러 반영해 주세요.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '파일 업로드 중 문제가 생겼어요.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className={styles.uploader}>
      <input name={urlName} readOnly type="hidden" value={url} />
      {objectKeyName ? (
        <input name={objectKeyName} readOnly type="hidden" value={objectKey} />
      ) : null}

      <div className={styles.header}>
        <div className={styles.copy}>
          <p>{label}</p>
          <span>{description}</span>
        </div>
        <button
          className={styles.chooseButton}
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          type="button">
          {isUploading ? '업로드 중' : buttonLabel}
        </button>
      </div>

      <input
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (file) {
            void uploadFile(file);
          }
        }}
        ref={fileInputRef}
        type="file"
      />

      {url && preview === 'image' ? (
        <div
          aria-label={`${label} 미리보기`}
          className={styles.imagePreview}
          role="img"
          style={{ backgroundImage: `url(${url})` }}
        />
      ) : null}

      {url && preview === 'video' ? (
        <video className={styles.videoPreview} controls src={url} />
      ) : null}

      {!url ? (
        <div className={styles.emptyPreview}>
          <span aria-hidden="true">VR</span>
          <strong>{emptyLabel}</strong>
          <small>{accept.includes('image') ? 'JPG · PNG' : 'MP4 · WEBM'}</small>
        </div>
      ) : (
        <p className={styles.url}>{url}</p>
      )}

      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
