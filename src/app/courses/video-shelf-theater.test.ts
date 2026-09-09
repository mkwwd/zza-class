import { createElement } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { VideoShelfTheater } from './video-shelf-theater';

describe('VideoShelfTheater playback actions', () => {
  it('renders no active course CTA when the selected tape is not playable', () => {
    const markup = renderToStaticMarkup(
      createElement(VideoShelfTheater, {
        tapes: [
          {
            id: 'course-1',
            title: '편성 대기작',
            description: null,
            thumbnailUrl: null,
            hasPlayableVideo: false,
            display: {
              code: 'TAPE 001',
              episodeLabel: '1화',
              runtimeLabel: '편성 대기',
              shelfLabel: '편성 대기',
              tone: 'amber',
            },
          },
        ],
        userHref: '/main',
        userLabel: '내 보관함',
      }),
    );

    expect(markup).toContain('편성 대기');
    expect(markup).not.toContain('href="/courses/course-1"');
  });
});
