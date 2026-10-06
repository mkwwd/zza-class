import { describe, expect, it } from 'vitest';

import { formatCourseStatus, getTapeDisplay } from './course-display';

describe('formatCourseStatus', () => {
  it('formats course status labels for admins', () => {
    expect(formatCourseStatus('published')).toBe('공개');
    expect(formatCourseStatus('draft')).toBe('비공개');
  });
});

describe('getTapeDisplay', () => {
  it('formats courses as short drama tapes with episode and runtime labels', () => {
    expect(
      getTapeDisplay({
        index: 2,
        hasPlayableVideo: true,
        isEnrolled: true,
        lessonCount: 7,
        runtimeSeconds: 188,
      }),
    ).toEqual({
      code: 'TAPE 003',
      episodeLabel: '7화',
      runtimeLabel: '3분 8초',
      shelfLabel: '보관 중',
      tone: 'rose',
    });
  });

  it('keeps empty courses readable as a coming soon tape', () => {
    expect(
      getTapeDisplay({
        index: 5,
        hasPlayableVideo: false,
        isEnrolled: false,
        lessonCount: 0,
        runtimeSeconds: null,
      }).episodeLabel,
    ).toBe('준비 중');
  });

  it('does not estimate runtime when a course duration is missing', () => {
    expect(
      getTapeDisplay({
        index: 0,
        hasPlayableVideo: true,
        lessonCount: 4,
        runtimeSeconds: null,
      }).runtimeLabel,
    ).toBe('시간 미등록');
  });

  it('keeps courses without playable episodes in a pending state', () => {
    expect(
      getTapeDisplay({
        index: 0,
        hasPlayableVideo: false,
        lessonCount: 2,
        runtimeSeconds: null,
      }),
    ).toMatchObject({
      runtimeLabel: '편성 대기',
      shelfLabel: '편성 대기',
    });
  });
});
