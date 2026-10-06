import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildR2ObjectKey,
  buildR2PublicUrl,
  createR2PutObjectUpload,
  getR2UploadPreset,
  readR2Config,
} from './r2';

const { getSignedUrlMock } = vi.hoisted(() => ({
  getSignedUrlMock: vi.fn().mockResolvedValue('https://signed.example/upload'),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: getSignedUrlMock,
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it('keeps optional previews separate from full episodes', () => {
    expect(
      buildR2ObjectKey({
        fileName: 'Teaser.MP4',
        kind: 'preview',
        objectId: 'course-123',
      }),
    ).toBe('previews/course-123-teaser.mp4');
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

    expect(
      getR2UploadPreset({ contentType: 'video/webm', kind: 'preview' }),
    ).toEqual({
      directory: 'previews',
      maxSizeBytes: 1024 * 1024 * 1024,
    });
  });

  it('uses a dedicated private bucket for video uploads', () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'account-1');
    vi.stubEnv('CLOUDFLARE_R2_ACCESS_KEY_ID', 'access-key');
    vi.stubEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'secret-key');
    vi.stubEnv('CLOUDFLARE_R2_BUCKET_NAME', 'public-assets');
    vi.stubEnv('CLOUDFLARE_R2_PUBLIC_BASE_URL', 'https://media.example.com');
    vi.stubEnv('CLOUDFLARE_R2_VIDEO_BUCKET_NAME', 'private-videos');

    expect(readR2Config('video')).toMatchObject({
      bucketName: 'private-videos',
    });
    expect(readR2Config('thumbnail')).toMatchObject({
      bucketName: 'public-assets',
      publicBaseUrl: 'https://media.example.com',
    });
  });

  it('never returns a permanent public URL for private video uploads', async () => {
    const upload = await createR2PutObjectUpload({
      contentType: 'video/mp4',
      fileName: 'episode.mp4',
      kind: 'video',
      objectId: 'lesson-1',
      r2Config: {
        accountId: 'account-1',
        accessKeyId: 'access-key',
        bucketName: 'private-videos',
        publicBaseUrl: 'https://media.example.com',
        secretAccessKey: 'secret-key',
      },
    });

    expect(upload).toEqual({
      objectKey: 'videos/lesson-1-episode.mp4',
      publicUrl: null,
      uploadUrl: 'https://signed.example/upload',
    });
  });
});
