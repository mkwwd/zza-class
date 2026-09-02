import { describe, expect, it } from 'vitest';

import { getCatAssistantCopy } from './cat-search-assistant-state';

describe('cat search assistant copy', () => {
  it('welcomes visitors before the cat is clicked', () => {
    expect(getCatAssistantCopy(false)).toBe(
      '어서 와요. 오늘은 어떤 이야기를 빌려가실래요?',
    );
  });

  it('invites a search after the cat is clicked', () => {
    expect(getCatAssistantCopy(true)).toBe('지금 찾는 비디오가 있나옹?');
  });
});
