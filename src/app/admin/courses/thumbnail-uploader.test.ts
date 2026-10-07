import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ThumbnailUploader, VideoUploader } from './thumbnail-uploader';
import {
  createVideoUploadState,
  isVideoUploadPending,
  normalizeVideoDuration,
  reduceVideoUploadState,
} from './video-upload-state';

describe('ThumbnailUploader', () => {
  it('renders an uploaded cover inside a poster preview', () => {
    const markup = renderToStaticMarkup(
      createElement(ThumbnailUploader, {
        description: '작품 표지',
        initialImageUrl: 'https://media.example.com/poster.jpg',
        label: '비디오 표지',
      }),
    );

    expect(markup).toContain('data-preview="poster"');
    expect(markup).toContain('https://media.example.com/poster.jpg');
  });

  it('previews a private cover without saving its proxy URL as data', () => {
    const markup = renderToStaticMarkup(
      createElement(ThumbnailUploader, {
        description: '작품 표지',
        initialImageId: 'thumbnails/course-1.jpg',
        initialPreviewUrl: '/api/images/courses/course-1',
        label: '비디오 표지',
      }),
    );

    expect(markup).toContain('/api/images/courses/course-1');
    expect(markup).toContain('name="thumbnailImageId"');
    expect(markup).toContain('value="thumbnails/course-1.jpg"');
    expect(markup).toContain('name="thumbnailUrl"');
    expect(markup).not.toContain(
      'name="thumbnailUrl" readonly="" type="hidden" value="/api/images/courses/course-1"',
    );
  });
});

describe('VideoUploader', () => {
  it('submits the stored duration for an existing video', () => {
    const markup = renderToStaticMarkup(
      createElement(VideoUploader, {
        description: '회차 영상',
        initialDurationSeconds: 146,
        initialVideoUrl: 'https://media.example.com/episode.mp4',
        label: '회차 영상',
      }),
    );

    expect(markup).toContain('name="durationSeconds"');
    expect(markup).toContain('value="146"');
  });

  it('submits private object keys without rendering a permanent video URL', () => {
    const markup = renderToStaticMarkup(
      createElement(VideoUploader, {
        description: '회차 영상',
        initialVideoObjectKey: 'videos/lesson-1.mp4',
        label: '회차 영상',
      }),
    );

    expect(markup).toContain('name="videoObjectKey"');
    expect(markup).toContain('value="videos/lesson-1.mp4"');
    expect(markup).not.toContain('https://media.example.com');
  });

  it('commits a replacement URL and duration only after both are ready', () => {
    const initial = createVideoUploadState(
      'https://media.example.com/original.mp4',
      146,
    );
    const selected = reduceVideoUploadState(initial, {
      previewUrl: 'blob:replacement',
      type: 'replacement-selected',
    });
    const metadataReady = reduceVideoUploadState(selected, {
      durationSeconds: 212,
      type: 'metadata-ready',
    });

    expect(metadataReady.committed).toEqual(initial.committed);
    expect(metadataReady.previewUrl).toBe('blob:replacement');
    expect(isVideoUploadPending(metadataReady)).toBe(true);

    const uploaded = reduceVideoUploadState(metadataReady, {
      type: 'upload-succeeded',
      url: 'https://media.example.com/replacement.mp4',
    });

    expect(uploaded.committed).toEqual({
      durationSeconds: 212,
      url: 'https://media.example.com/replacement.mp4',
    });
    expect(isVideoUploadPending(uploaded)).toBe(false);
  });

  it('restores the previous URL and duration when replacement upload fails', () => {
    const initial = createVideoUploadState(
      'https://media.example.com/original.mp4',
      146,
    );
    const selected = reduceVideoUploadState(initial, {
      previewUrl: 'blob:replacement',
      type: 'replacement-selected',
    });
    const metadataReady = reduceVideoUploadState(selected, {
      durationSeconds: 212,
      type: 'metadata-ready',
    });
    const failed = reduceVideoUploadState(metadataReady, {
      type: 'upload-failed',
    });

    expect(failed.committed).toEqual(initial.committed);
    expect(failed.previewUrl).toBe(initial.committed.url);
    expect(isVideoUploadPending(failed)).toBe(false);
  });

  it('commits a nullable duration when metadata cannot be read', () => {
    const initial = createVideoUploadState('', null);
    const selected = reduceVideoUploadState(initial, {
      previewUrl: 'blob:new-video',
      type: 'replacement-selected',
    });
    const uploaded = reduceVideoUploadState(selected, {
      type: 'upload-succeeded',
      url: 'https://media.example.com/new-video.mp4',
    });
    const metadataFailed = reduceVideoUploadState(uploaded, {
      type: 'metadata-failed',
    });

    expect(metadataFailed.committed).toEqual({
      durationSeconds: null,
      url: 'https://media.example.com/new-video.mp4',
    });
    expect(metadataFailed.previewUrl).toBe('blob:new-video');
    expect(isVideoUploadPending(metadataFailed)).toBe(false);
  });

  it('rounds valid metadata and rejects invalid durations', () => {
    expect(normalizeVideoDuration(211.6)).toBe(212);
    expect(normalizeVideoDuration(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normalizeVideoDuration(-1)).toBeNull();
  });
});
