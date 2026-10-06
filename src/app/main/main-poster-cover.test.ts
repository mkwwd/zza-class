import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const stylesSource = readFileSync(
  new URL('./video-room.module.css', import.meta.url),
  'utf8',
);

describe('main poster cover', () => {
  it('uses full-width 2:3 artwork without a separate VHS spine', () => {
    expect(pageSource).not.toContain('styles.coverSpine');
    expect(stylesSource).toMatch(
      /\.coverCase\s*{[^}]*aspect-ratio:\s*2\s*\/\s*3;/s,
    );
  });
});
