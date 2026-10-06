import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CatSearchCounter } from './cat-search-counter';

describe('CatSearchCounter', () => {
  it('keeps the cat greeting and open sign visible without the hero logo', () => {
    const markup = renderToStaticMarkup(
      createElement(CatSearchCounter, { initialQuery: '' }),
    );

    expect(markup).toContain('어서 와요. 오늘은 어떤 이야기를 빌려가실래요?');
    expect(markup).toContain('OPEN');
    expect(markup).not.toContain('VIDEO ROOM');
  });
});
