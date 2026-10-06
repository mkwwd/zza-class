import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { VhsTape } from './VideoRoomVisuals';

describe('VhsTape', () => {
  it('renders a horizontal episode tape with its Korean episode number', () => {
    const markup = renderToStaticMarkup(
      createElement(VhsTape, {
        code: 'EPISODE 01',
        label: '1회',
        orientation: 'horizontal',
      }),
    );

    expect(markup).toContain('1회');
    expect(markup).toContain('EPISODE 01');
    expect(markup).toContain('data-orientation="horizontal"');
  });
});
