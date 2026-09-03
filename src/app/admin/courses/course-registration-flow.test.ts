import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import NewCoursePage from './new/page';

vi.mock('@/lib/auth/server', () => ({
  requireAdmin: vi.fn().mockResolvedValue(undefined),
}));

describe('new video registration flow', () => {
  it('collects only title-level information before episode editing', async () => {
    const page = await NewCoursePage({ searchParams: Promise.resolve({}) });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('작품 정보를 먼저 준비해 주세요.');
    expect(markup).toContain('등록 후 회차를 추가할 수 있어요.');
    expect(markup).not.toContain('첫 회차 제목');
    expect(markup).not.toContain('첫 회차 영상');
    expect(markup).not.toContain('첫 회차 설명');
    expect(markup).not.toContain('name="episodeTitle"');
    expect(markup).not.toContain('name="episodeContent"');
    expect(markup).not.toContain('name="videoUrl"');
  });
});
