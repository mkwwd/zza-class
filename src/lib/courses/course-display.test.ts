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
        isEnrolled: true,
        lessonCount: 7,
      }),
    ).toEqual({
      code: 'TAPE 003',
      episodeLabel: '7화',
      runtimeLabel: '약 42분',
      shelfLabel: '보관 중',
      tone: 'rose',
    });
  });

  it('keeps empty courses readable as a coming soon tape', () => {
    expect(
      getTapeDisplay({
        index: 5,
        isEnrolled: false,
        lessonCount: 0,
      }).episodeLabel,
    ).toBe('준비 중');
  });
});
