import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ThumbnailUploader, VideoUploader } from './thumbnail-uploader';

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
});
