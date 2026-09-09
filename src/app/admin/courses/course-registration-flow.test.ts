import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addLesson, createCourse, updateCourse } from './actions';
import NewCoursePage from './new/page';

const { genreRows, redirectMock, requireAdminMock } = vi.hoisted(() => ({
  genreRows: [
    { label_en: 'DRAMA', label_ko: '드라마', slug: 'drama', sort_order: 1 },
    {
      label_en: 'FANTASY',
      label_ko: '판타지',
      slug: 'fantasy',
      sort_order: 2,
    },
  ],
  redirectMock: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  requireAdminMock: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

beforeEach(() => {
  requireAdminMock.mockReset();
  redirectMock.mockClear();
});

describe('new video registration flow', () => {
  it('collects only title-level information before episode editing', async () => {
    requireAdminMock.mockResolvedValue({
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: genreRows }),
          }),
        }),
      },
    });

    const page = await NewCoursePage({ searchParams: Promise.resolve({}) });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('작품 정보를 먼저 준비해 주세요.');
    expect(markup).toContain('등록 후 회차를 추가할 수 있어요.');
    expect(markup).toContain('장르');
    expect(markup).toContain('최대 2개');
    expect(markup).not.toContain('첫 회차 제목');
    expect(markup).not.toContain('첫 회차 영상');
    expect(markup).not.toContain('첫 회차 설명');
    expect(markup).not.toContain('name="episodeTitle"');
    expect(markup).not.toContain('name="episodeContent"');
    expect(markup).not.toContain('name="videoUrl"');
  });

  it('removes a new course when genre replacement fails', async () => {
    const cleanupEq = vi.fn().mockResolvedValue({ error: null });
    const cleanupDelete = vi.fn().mockReturnValue({ eq: cleanupEq });
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'course-1' },
      error: null,
    });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });
    const from = vi.fn().mockReturnValue({ delete: cleanupDelete, insert });
    const rpc = vi
      .fn()
      .mockResolvedValue({ error: new Error('genre failure') });

    requireAdminMock.mockResolvedValue({
      supabase: { from, rpc },
      user: { id: 'admin-1' },
    });

    const formData = new FormData();
    formData.set('title', '밤의 비디오');
    formData.append('genres', 'drama');

    await expect(createCourse(formData)).rejects.toThrow(
      'redirect:/admin/courses/new?error=invalid-course',
    );
    expect(rpc).toHaveBeenCalledWith('replace_course_genres', {
      selected_genre_slugs: ['drama'],
      target_course_id: 'course-1',
    });
    expect(cleanupDelete).toHaveBeenCalledOnce();
    expect(cleanupEq).toHaveBeenCalledWith('id', 'course-1');
  });

  it('stores duration and availability on the lesson row', async () => {
    const lessonSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: 'lesson-1' } });
    const lessonSelect = vi.fn().mockReturnValue({ single: lessonSingle });
    const lessonInsert = vi.fn().mockReturnValue({ select: lessonSelect });
    const contentInsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) =>
      table === 'lessons'
        ? { insert: lessonInsert }
        : { insert: contentInsert },
    );

    requireAdminMock.mockResolvedValue({ supabase: { from } });

    const formData = new FormData();
    formData.set('title', '1화');
    formData.set('sortOrder', '1');
    formData.set('durationSeconds', '146');
    formData.set('videoUrl', 'https://media.example.com/episode.mp4');

    await addLesson('course-1', formData);

    expect(lessonInsert).toHaveBeenCalledWith({
      course_id: 'course-1',
      duration_seconds: 146,
      has_video: true,
      sort_order: 1,
      title: '1화',
    });
    expect(contentInsert).toHaveBeenCalledWith({
      content: '',
      lesson_id: 'lesson-1',
      video_url: 'https://media.example.com/episode.mp4',
    });
  });

  it('does not replace genres when the course update fails', async () => {
    const eq = vi
      .fn()
      .mockResolvedValue({ error: new Error('update failure') });
    const update = vi.fn().mockReturnValue({ eq });
    const rpc = vi.fn();

    requireAdminMock.mockResolvedValue({
      supabase: {
        from: vi.fn().mockReturnValue({ update }),
        rpc,
      },
    });

    const formData = new FormData();
    formData.set('title', '밤의 비디오');
    formData.append('genres', 'drama');

    await expect(updateCourse('course-1', formData)).rejects.toThrow(
      'redirect:/admin/courses/course-1/edit?error=invalid-course',
    );
    expect(rpc).not.toHaveBeenCalled();
  });
});
