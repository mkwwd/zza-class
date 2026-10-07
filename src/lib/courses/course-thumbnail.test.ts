import { describe, expect, it } from 'vitest';

import { getCourseThumbnailSrc } from './course-thumbnail';

describe('getCourseThumbnailSrc', () => {
  it('uses the same-origin image proxy for private R2 thumbnails', () => {
    expect(
      getCourseThumbnailSrc({
        id: 'course 1',
        thumbnail_image_id: 'thumbnails/course-1.jpg',
        thumbnail_url: 'https://legacy.example/poster.jpg',
      }),
    ).toBe('/api/images/courses/course%201');
  });

  it('falls back to a legacy thumbnail URL when no object key exists', () => {
    expect(
      getCourseThumbnailSrc({
        id: 'course-1',
        thumbnail_url: 'https://legacy.example/poster.jpg',
      }),
    ).toBe('https://legacy.example/poster.jpg');
  });

  it('returns null when a course has no thumbnail', () => {
    expect(
      getCourseThumbnailSrc({
        id: 'course-1',
        thumbnail_image_id: null,
        thumbnail_url: null,
      }),
    ).toBeNull();
  });
});
