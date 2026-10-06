import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { toggleGenreSelection, type GenreOption } from '@/lib/courses/genres';

import { GenreSelector } from './genre-selector';

const options: GenreOption[] = [
  { labelEn: 'DRAMA', labelKo: '드라마', slug: 'drama' },
  { labelEn: 'FANTASY', labelKo: '판타지', slug: 'fantasy' },
  { labelEn: 'ROMANCE', labelKo: '로맨스', slug: 'romance' },
];

describe('GenreSelector', () => {
  it('renders selected genres as ordered form values', () => {
    const markup = renderToStaticMarkup(
      createElement(GenreSelector, {
        initialSelected: ['drama'],
        options,
      }),
    );

    expect(markup).toContain('드라마');
    expect(markup).toContain('판타지');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('name="genres"');
    expect(markup).toContain('value="drama"');
    expect(markup).toContain('1/2');
  });

  it('preserves selection order and disables a third choice', () => {
    const markup = renderToStaticMarkup(
      createElement(GenreSelector, {
        initialSelected: ['fantasy', 'drama'],
        options,
      }),
    );

    expect(markup.indexOf('value="fantasy"')).toBeLessThan(
      markup.indexOf('value="drama"'),
    );
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('2/2');
  });

  it('removes selected genres and refuses a third selection', () => {
    expect(toggleGenreSelection(['drama', 'fantasy'], 'drama')).toEqual([
      'fantasy',
    ]);
    expect(toggleGenreSelection(['drama', 'fantasy'], 'romance')).toEqual([
      'drama',
      'fantasy',
    ]);
  });
});
