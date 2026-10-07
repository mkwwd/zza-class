import { describe, expect, it } from 'vitest';

import {
  getCoursePreviewHref,
  getCourseGenreLabels,
  getLessonPlaybackHref,
  getPublicCoursePlayback,
} from './public-course-metadata';

describe('public course playback metadata', () => {
  it('uses an uploaded preview before the public first episode', () => {
    expect(
      getCoursePreviewHref({
        courseId: 'course-1',
        hasUploadedPreview: true,
        lessons: [
          {
            id: 'lesson-1',
            duration_seconds: 146,
            has_video: true,
            sort_order: 1,
          },
        ],
      }),
    ).toBe('/courses/course-1/preview');
  });

  it('never substitutes a paid later episode for a missing first episode preview', () => {
    expect(
      getCoursePreviewHref({
        courseId: 'course-1',
        hasUploadedPreview: false,
        lessons: [
          {
            id: 'lesson-2',
            duration_seconds: 146,
            has_video: true,
            sort_order: 2,
          },
        ],
      }),
    ).toBeNull();
  });

  it('selects the first playable lesson in display order', () => {
    expect(
      getPublicCoursePlayback([
        {
          id: 'lesson-1',
          duration_seconds: null,
          has_video: false,
        },
        { id: 'lesson-2', duration_seconds: 146, has_video: true },
        { id: 'lesson-3', duration_seconds: 42, has_video: true },
      ]),
    ).toEqual({
      firstPlayableLessonId: 'lesson-2',
      hasPlayableVideo: true,
      runtimeLabel: '3분 8초',
      runtimeSeconds: 188,
    });
  });

  it('marks a course with no playable lesson as pending', () => {
    expect(
      getPublicCoursePlayback([
        {
          id: 'lesson-1',
          duration_seconds: null,
          has_video: false,
        },
      ]),
    ).toEqual({
      firstPlayableLessonId: null,
      hasPlayableVideo: false,
      runtimeLabel: '편성 대기',
      runtimeSeconds: null,
    });
  });

  it('keeps a playable course with a missing duration unregistered', () => {
    expect(
      getPublicCoursePlayback([
        { id: 'lesson-1', duration_seconds: null, has_video: true },
      ]).runtimeLabel,
    ).toBe('시간 미등록');
  });

  it('does not create an episode link for an unplayable lesson', () => {
    expect(
      getLessonPlaybackHref({
        courseId: 'course-1',
        isRented: true,
        lesson: {
          id: 'lesson-1',
          duration_seconds: null,
          has_video: false,
          sort_order: 1,
        },
      }),
    ).toBeNull();
  });

  it('creates a public link for the playable first episode', () => {
    expect(
      getLessonPlaybackHref({
        courseId: 'course-1',
        isRented: false,
        lesson: {
          id: 'lesson-1',
          duration_seconds: 146,
          has_video: true,
          sort_order: 1,
        },
      }),
    ).toBe('/courses/course-1/lessons/lesson-1');
  });

  it('creates later episode links only for individually rented lessons', () => {
    const lesson = {
      id: 'lesson-2',
      duration_seconds: 146,
      has_video: true,
      sort_order: 2,
    };

    expect(
      getLessonPlaybackHref({
        courseId: 'course-1',
        isRented: false,
        lesson,
      }),
    ).toBeNull();
    expect(
      getLessonPlaybackHref({
        courseId: 'course-1',
        isRented: true,
        lesson,
      }),
    ).toBe('/courses/course-1/lessons/lesson-2');
  });
});

describe('public genre result shaping', () => {
  it('preserves ordered labels from Supabase object and array relations', () => {
    expect(
      getCourseGenreLabels([
        { genres: { label_en: 'THRILLER' } },
        { genres: [{ label_en: 'FANTASY' }] },
        { genres: null },
      ]),
    ).toEqual(['THRILLER', 'FANTASY']);
  });
});
