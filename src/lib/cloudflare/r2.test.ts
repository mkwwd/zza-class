import { describe, expect, it } from 'vitest';

import { buildR2ObjectKey, buildR2PublicUrl, getR2UploadPreset } from './r2';

describe('R2 upload helpers', () => {
  it('builds stable thumbnail object keys from file names', () => {
    expect(
      buildR2ObjectKey({
        fileName: 'React Basics.PNG',
        kind: 'thumbnail',
        objectId: 'course-123',
      }),
    ).toBe('thumbnails/course-123-react-basics.png');
  });

  it('builds stable video object keys from file names', () => {
    expect(
      buildR2ObjectKey({
        fileName: 'Intro Video.MP4',
        kind: 'video',
        objectId: 'lesson-1',
      }),
    ).toBe('videos/lesson-1-intro-video.mp4');
  });

  it('joins the public base URL and object key without duplicate slashes', () => {
    expect(
      buildR2PublicUrl({
        objectKey: 'videos/lesson-1.mp4',
        publicBaseUrl: 'https://media.example.com/',
      }),
    ).toBe('https://media.example.com/videos/lesson-1.mp4');
  });

  it('accepts images only for thumbnail uploads', () => {
    expect(
      getR2UploadPreset({ contentType: 'image/webp', kind: 'thumbnail' }),
    ).toEqual({
      directory: 'thumbnails',
      maxSizeBytes: 5 * 1024 * 1024,
    });

    expect(() =>
      getR2UploadPreset({ contentType: 'video/mp4', kind: 'thumbnail' }),
    ).toThrow('썸네일은 이미지 파일만 업로드할 수 있어요.');
  });

  it('accepts videos only for video uploads', () => {
    expect(
      getR2UploadPreset({ contentType: 'video/mp4', kind: 'video' }),
    ).toEqual({
      directory: 'videos',
      maxSizeBytes: 1024 * 1024 * 1024,
    });

    expect(() =>
      getR2UploadPreset({ contentType: 'image/png', kind: 'video' }),
    ).toThrow('영상은 mp4 또는 webm 파일만 업로드할 수 있어요.');
  });
});
