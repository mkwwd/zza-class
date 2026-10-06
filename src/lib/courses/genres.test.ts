import { describe, expect, it } from 'vitest';

import {
  formatGenreLabels,
  parseGenreSlugs,
  toggleGenreSelection,
} from './genres';

describe('genre metadata', () => {
  it('accepts an empty genre selection', () => {
    expect(parseGenreSlugs([])).toEqual({ ok: true, value: [] });
  });

  it('preserves up to two selected genres in order', () => {
    expect(parseGenreSlugs(['drama', 'fantasy'])).toEqual({
      ok: true,
      value: ['drama', 'fantasy'],
    });
  });

  it('de-duplicates repeated genres without changing order', () => {
    expect(parseGenreSlugs(['drama', 'drama'])).toEqual({
      ok: true,
      value: ['drama'],
    });
  });

  it('rejects more than two distinct genres', () => {
    expect(parseGenreSlugs(['drama', 'fantasy', 'romance']).ok).toBe(false);
  });

  it('rejects genres outside the fixed catalog', () => {
    expect(parseGenreSlugs(['unknown']).ok).toBe(false);
  });

  it('adds a second genre selection', () => {
    expect(toggleGenreSelection(['drama'], 'fantasy')).toEqual([
      'drama',
      'fantasy',
    ]);
  });

  it('removes a genre that is already selected', () => {
    expect(toggleGenreSelection(['drama', 'fantasy'], 'drama')).toEqual([
      'fantasy',
    ]);
  });

  it('does not add a third genre selection', () => {
    expect(toggleGenreSelection(['drama', 'fantasy'], 'romance')).toEqual([
      'drama',
      'fantasy',
    ]);
  });

  it('formats selected public genre labels', () => {
    expect(formatGenreLabels(['DRAMA', 'FANTASY'])).toBe('DRAMA · FANTASY');
  });

  it('formats an empty genre selection', () => {
    expect(formatGenreLabels([])).toBe('장르 미등록');
  });
});
