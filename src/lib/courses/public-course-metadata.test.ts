import { describe, expect, it } from 'vitest';

import {
  getCourseGenreLabels,
  getLessonPlaybackHref,
  getPublicCoursePlayback,
} from './public-course-metadata';

describe('public course playback metadata', () => {
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
        isEnrolled: true,
        lesson: {
          id: 'lesson-1',
          duration_seconds: null,
          has_video: false,
        },
      }),
    ).toBeNull();
  });

  it('creates an episode link only for an enrolled playable lesson', () => {
    expect(
      getLessonPlaybackHref({
        courseId: 'course-1',
        isEnrolled: true,
        lesson: {
          id: 'lesson-2',
          duration_seconds: 146,
          has_video: true,
        },
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
