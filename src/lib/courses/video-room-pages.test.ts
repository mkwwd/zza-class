import { describe, expect, it } from 'vitest';

import { getEpisodeNavigation, partitionMyBagTitles } from './video-room-pages';

describe('partitionMyBagTitles', () => {
  it('keeps titles with unfinished episodes in the rented section', () => {
    const result = partitionMyBagTitles(
      [
        { id: 'forest', lessonIds: ['ep-1', 'ep-2'] },
        { id: 'moon', lessonIds: ['ep-3'] },
      ],
      new Set(['ep-1', 'ep-3']),
    );

    expect(result.rented.map((title) => title.id)).toEqual(['forest']);
    expect(result.completed.map((title) => title.id)).toEqual(['moon']);
  });

  it('treats a title without episodes as rented rather than completed', () => {
    const result = partitionMyBagTitles(
      [{ id: 'coming-soon', lessonIds: [] }],
      new Set(),
    );

    expect(result.rented).toHaveLength(1);
    expect(result.completed).toHaveLength(0);
  });
});

describe('getEpisodeNavigation', () => {
  it('returns adjacent episode ids around the active episode', () => {
    expect(
      getEpisodeNavigation(
        [{ id: 'ep-1' }, { id: 'ep-2' }, { id: 'ep-3' }],
        'ep-2',
      ),
    ).toEqual({ previousId: 'ep-1', nextId: 'ep-3' });
  });

  it('returns null boundaries for the first and last episodes', () => {
    expect(
      getEpisodeNavigation([{ id: 'ep-1' }, { id: 'ep-2' }], 'ep-1'),
    ).toEqual({ previousId: null, nextId: 'ep-2' });
    expect(
      getEpisodeNavigation([{ id: 'ep-1' }, { id: 'ep-2' }], 'ep-2'),
    ).toEqual({ previousId: 'ep-1', nextId: null });
  });
});
