import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { VideoRoomShell } from './VideoRoomShell';

describe('VideoRoomShell', () => {
  it('matches the main navigation for admin users in shop mode', () => {
    const markup = renderToStaticMarkup(
      createElement(
        VideoRoomShell,
        {
          activeItem: 'my-page',
          isAdmin: true,
          showStaffCat: false,
        },
        createElement('main', null, 'content'),
      ),
    );

    expect(markup.match(/<nav[^>]*>(.*?)<\/nav>/s)?.[1]).toContain('홈');
    expect(markup.match(/<nav[^>]*>(.*?)<\/nav>/s)?.[1]).toContain(
      '마이 페이지',
    );
    expect(markup.match(/<nav[^>]*>(.*?)<\/nav>/s)?.[1]).toContain('편집실');
    expect(markup.match(/<nav[^>]*>(.*?)<\/nav>/s)?.[1]).not.toContain(
      '새로운 작품',
    );
    expect(markup.match(/<nav[^>]*>(.*?)<\/nav>/s)?.[1]).not.toContain(
      '찜한 작품',
    );
    expect(markup.match(/<nav[^>]*>(.*?)<\/nav>/s)?.[1]).not.toContain(
      '시청 기록',
    );
  });
});
