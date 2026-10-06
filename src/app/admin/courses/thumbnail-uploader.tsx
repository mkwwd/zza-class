'use client';

import { useEffect, useReducer, useRef, useState } from 'react';

import styles from './media-uploader.module.css';
import {
  createVideoUploadState,
  isVideoUploadPending,
  normalizeVideoDuration,
  reduceVideoUploadState,
} from './video-upload-state';

type UploadResponse = {
  objectKey?: string;
  publicUrl?: string;
  uploadUrl?: string;
  error?: string;
};

type MediaUploaderProps = {
  description: string;
  initialObjectKey?: string | null;
  initialDurationSeconds?: number | null;
  initialUrl?: string | null;
  kind: 'preview' | 'thumbnail' | 'video';
  label: string;
  objectKeyName?: string;
  durationName?: string | null;
  urlName?: string | null;
};

const uploadCopy = {
  thumbnail: {
    accept: 'image/*',
    buttonLabel: '이미지 선택',
    emptyLabel: '등록된 썸네일이 없어요.',
    formats: 'JPG · PNG',
  },
  video: {
    accept: 'video/mp4,video/webm',
    buttonLabel: '영상 선택',
    emptyLabel: '등록된 영상이 없어요.',
    formats: 'MP4 · WEBM',
  },
  preview: {
    accept: 'video/mp4,video/webm',
    buttonLabel: '미리보기 선택',
    emptyLabel: '별도 미리보기가 없어요.',
    formats: 'MP4 · WEBM · 선택',
  },
} as const;

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
  durationName?: string | null;
  initialDurationSeconds?: number | null;
  initialVideoObjectKey?: string | null;
  initialVideoUrl?: string | null;
  label: string;
  objectKeyName?: string;
  uploadKind?: 'preview' | 'video';
  urlName?: string | null;
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
      description={description}
      initialObjectKey={initialImageId}
      initialUrl={initialImageUrl}
      kind="thumbnail"
      label={label}
      objectKeyName={imageIdName}
      urlName={urlName}
    />
  );
}

export function VideoUploader({
  description,
  durationName = 'durationSeconds',
  initialDurationSeconds = null,
  initialVideoObjectKey = '',
  initialVideoUrl = '',
  label,
  objectKeyName = 'videoObjectKey',
  uploadKind = 'video',
  urlName = 'videoUrl',
}: VideoUploaderProps) {
  return (
    <MediaUploader
      description={description}
      durationName={durationName}
      initialDurationSeconds={initialDurationSeconds}
      initialObjectKey={initialVideoObjectKey}
      initialUrl={initialVideoUrl}
      kind={uploadKind}
      label={label}
      objectKeyName={objectKeyName}
      urlName={urlName}
    />
  );
}

function MediaUploader({
  description,
  durationName,
  initialDurationSeconds = null,
  initialObjectKey = '',
  initialUrl = '',
  kind,
  label,
  objectKeyName,
  urlName,
}: MediaUploaderProps) {
  const copy = uploadCopy[kind];
  const isVideo = kind !== 'thumbnail';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);
  const [objectKey, setObjectKey] = useState(initialObjectKey ?? '');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [videoState, dispatchVideo] = useReducer(
    reduceVideoUploadState,
    createVideoUploadState(initialUrl ?? '', initialDurationSeconds),
  );
  const [durationMessage, setDurationMessage] = useState('');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const isVideoPending = isVideo && isVideoUploadPending(videoState);
  const isSubmissionBlocked = isUploading || isVideoPending;
  const committedUrl = isVideo ? videoState.committed.url : url;
  const previewUrl = isVideo ? videoState.previewUrl : url;

  useEffect(
    () => () => {
      if (videoState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoState.previewUrl);
      }
    },
    [videoState.previewUrl],
  );

  useEffect(() => {
    const form = uploaderRef.current?.closest('form');

    if (!form) return;

    function handlePendingSubmit(event: SubmitEvent) {
      if (!isSubmissionBlocked) return;

      event.preventDefault();
      setMessage('파일 업로드와 재생시간 확인이 끝난 뒤 저장해 주세요.');
    }

    form.addEventListener('submit', handlePendingSubmit);
    return () => form.removeEventListener('submit', handlePendingSubmit);
  }, [isSubmissionBlocked]);

  function handleVideoMetadata(video: HTMLVideoElement) {
    const durationSeconds = normalizeVideoDuration(video.duration);

    if (durationSeconds !== null) {
      dispatchVideo({ durationSeconds, type: 'metadata-ready' });
      setDurationMessage('');
      return;
    }

    dispatchVideo({ type: 'metadata-failed' });
    setDurationMessage('재생시간을 읽지 못했어요. 저장 후 다시 확인해 주세요.');
  }

  function handleVideoMetadataError() {
    dispatchVideo({ type: 'metadata-failed' });
    setDurationMessage('재생시간을 읽지 못했어요. 저장 후 다시 확인해 주세요.');
  }

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
        (!isVideo && !presignedUploadPayload.publicUrl)
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

      if (isVideo) {
        setObjectKey(presignedUploadPayload.objectKey);
        dispatchVideo({
          type: 'upload-succeeded',
          url: '',
        });
      } else {
        setObjectKey(presignedUploadPayload.objectKey);
        setUrl(presignedUploadPayload.publicUrl ?? '');
      }
      setMessage('업로드 완료. 저장 버튼을 눌러 반영해 주세요.');
    } catch (error) {
      if (isVideo) {
        dispatchVideo({ type: 'upload-failed' });
      }
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
    <div
      aria-busy={isSubmissionBlocked}
      className={styles.uploader}
      ref={uploaderRef}>
      {urlName ? (
        <input name={urlName} readOnly type="hidden" value={committedUrl} />
      ) : null}
      {durationName ? (
        <input
          name={durationName}
          readOnly
          type="hidden"
          value={videoState.committed.durationSeconds ?? ''}
        />
      ) : null}
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
          disabled={isSubmissionBlocked}
          onClick={() => fileInputRef.current?.click()}
          type="button">
          {isUploading
            ? '업로드 중'
            : isVideoPending
              ? '영상 확인 중'
              : copy.buttonLabel}
        </button>
      </div>

      <input
        accept={copy.accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (file) {
            if (isVideo) {
              dispatchVideo({
                previewUrl: URL.createObjectURL(file),
                type: 'replacement-selected',
              });
              setDurationMessage('');
            }
            void uploadFile(file);
          }
        }}
        ref={fileInputRef}
        type="file"
      />

      {previewUrl && !isVideo ? (
        <div
          aria-label={`${label} 미리보기`}
          className={styles.imagePreview}
          data-preview="poster"
          role="img"
          style={{ backgroundImage: `url(${previewUrl})` }}
        />
      ) : null}

      {previewUrl && isVideo ? (
        <video
          className={styles.videoPreview}
          controls
          onError={handleVideoMetadataError}
          onLoadedMetadata={(event) => {
            handleVideoMetadata(event.currentTarget);
          }}
          src={previewUrl}
        />
      ) : null}

      {!previewUrl ? (
        <div
          className={`${styles.emptyPreview} ${!isVideo ? styles.posterPreview : ''}`}
          data-preview={isVideo ? 'video' : 'poster'}>
          <span aria-hidden="true">VR</span>
          <strong>{copy.emptyLabel}</strong>
          <small>{copy.formats}</small>
        </div>
      ) : null}

      {committedUrl && !isVideo ? (
        <p className={styles.url}>{committedUrl}</p>
      ) : null}

      {isVideo && objectKey && !previewUrl ? (
        <p className={styles.message}>비공개 영상이 등록되어 있어요.</p>
      ) : null}

      {message ? <p className={styles.message}>{message}</p> : null}
      {durationMessage ? (
        <p className={styles.message} role="status">
          {durationMessage}
        </p>
      ) : null}
    </div>
  );
}
