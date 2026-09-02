import { describe, expect, it } from 'vitest';

import { formatLessonNumber } from './lesson-display';

describe('formatLessonNumber', () => {
  it('formats zero-based lesson indexes as one-based Korean lesson numbers', () => {
    expect(formatLessonNumber(0)).toBe('1강');
    expect(formatLessonNumber(2)).toBe('3강');
  });
});
