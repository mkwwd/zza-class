import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { GenreOption } from '@/lib/courses/genres';

import { GenreSelector } from './genre-selector';

const options: GenreOption[] = [
  { labelEn: 'DRAMA', labelKo: '드라마', slug: 'drama' },
  { labelEn: 'FANTASY', labelKo: '판타지', slug: 'fantasy' },
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
});
