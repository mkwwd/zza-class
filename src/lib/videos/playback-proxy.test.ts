import { describe, expect, it } from 'vitest';

import {
  buildLessonPlaybackPath,
  buildPreviewPlaybackPath,
  getTrustedLegacyVideoUrl,
  getVideoProxyResponseHeaders,
  isDirectVideoNavigation,
} from './playback-proxy';

describe('video playback proxy', () => {
  it('keeps R2 addresses out of browser-visible playback paths', () => {
    expect(buildLessonPlaybackPath('lesson-1')).toBe(
      '/api/videos/lessons/lesson-1',
    );
    expect(buildPreviewPlaybackPath('course-1')).toBe(
      '/api/videos/courses/course-1/preview',
    );
  });

  it('rejects direct browser navigation but allows media requests', () => {
    expect(isDirectVideoNavigation('document')).toBe(true);
    expect(isDirectVideoNavigation('video')).toBe(false);
    expect(isDirectVideoNavigation(null)).toBe(false);
  });

  it('only proxies legacy videos from the configured R2 public origin', () => {
    expect(
      getTrustedLegacyVideoUrl(
        'https://media.example.com/videos/episode.mp4',
        'https://media.example.com',
      ),
    ).toBe('https://media.example.com/videos/episode.mp4');
    expect(
      getTrustedLegacyVideoUrl(
        'https://attacker.example/videos/episode.mp4',
        'https://media.example.com',
      ),
    ).toBeNull();
    expect(
      getTrustedLegacyVideoUrl(
        'https://media.example.com.attacker.example/episode.mp4',
        'https://media.example.com',
      ),
    ).toBeNull();
  });

  it('preserves range metadata without allowing shared browser caches', () => {
    const upstreamHeaders = new Headers({
      'accept-ranges': 'bytes',
      'content-length': '512',
      'content-range': 'bytes 0-511/1024',
      'content-type': 'video/mp4',
      etag: 'episode-etag',
    });

    expect(
      Object.fromEntries(getVideoProxyResponseHeaders(upstreamHeaders)),
    ).toEqual({
      'accept-ranges': 'bytes',
      'cache-control': 'private, no-store',
      'content-length': '512',
      'content-range': 'bytes 0-511/1024',
      'content-type': 'video/mp4',
      'cross-origin-resource-policy': 'same-origin',
      etag: 'episode-etag',
      'x-content-type-options': 'nosniff',
    });
  });
});
