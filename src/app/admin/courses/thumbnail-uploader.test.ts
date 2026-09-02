import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ThumbnailUploader } from './thumbnail-uploader';

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
