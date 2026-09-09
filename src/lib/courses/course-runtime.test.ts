import { describe, expect, it } from 'vitest';

import {
  formatRuntimeLabel,
  sumPlayableRuntimeSeconds,
} from './course-runtime';

describe('course runtime metadata', () => {
  it('returns no total when there are no playable episodes', () => {
    expect(sumPlayableRuntimeSeconds([])).toBeNull();
  });

  it('sums all known playable episode durations', () => {
    expect(sumPlayableRuntimeSeconds([146, 42])).toBe(188);
  });

  it('returns no total when any playable duration is missing', () => {
    expect(sumPlayableRuntimeSeconds([146, null])).toBeNull();
  });

  it('formats a duration under one minute', () => {
    expect(formatRuntimeLabel(42)).toBe('42초');
  });

  it('formats minutes and seconds', () => {
    expect(formatRuntimeLabel(146)).toBe('2분 26초');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatRuntimeLabel(3788)).toBe('1시간 3분 8초');
  });

  it('formats a missing duration', () => {
    expect(formatRuntimeLabel(null)).toBe('시간 미등록');
  });
});
