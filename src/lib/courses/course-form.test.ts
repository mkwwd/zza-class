import { describe, expect, it } from 'vitest';

import {
  parseCourseForm,
  parseInitialEpisodeForm,
  parseLessonForm,
} from './course-form';

describe('course form parsing', () => {
  it('accepts valid course data', () => {
    const formData = new FormData();
    formData.set('title', 'React Basics');
    formData.set('description', 'Start learning React.');
    formData.set('staffNote', '불을 낮추고 천천히 감상해 보세요.');
    formData.set('status', 'published');
    formData.set(
      'thumbnailUrl',
      'https://media.example.com/thumbnails/course-123.png',
    );
    formData.set('thumbnailImageId', 'course-image-id');

    expect(parseCourseForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'React Basics',
        description: 'Start learning React.',
        staffNote: '불을 낮추고 천천히 감상해 보세요.',
        status: 'published',
        thumbnailUrl: 'https://media.example.com/thumbnails/course-123.png',
        thumbnailImageId: 'course-image-id',
      },
    });
  });

  it('rejects missing course title', () => {
    const formData = new FormData();
    formData.set('status', 'draft');

    expect(parseCourseForm(formData)).toEqual({
      ok: false,
      error: 'Course title is required.',
    });
  });

  it('normalizes unknown course status to draft', () => {
    const formData = new FormData();
    formData.set('title', 'React Basics');
    formData.set('status', 'archived');

    expect(parseCourseForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'React Basics',
        description: '',
        staffNote: '',
        status: 'draft',
        thumbnailUrl: '',
        thumbnailImageId: '',
      },
    });
  });
});

describe('lesson form parsing', () => {
  it('accepts valid lesson data', () => {
    const formData = new FormData();
    formData.set('title', 'What is React?');
    formData.set('content', 'React is a UI library.');
    formData.set('videoUrl', 'https://example.com/video');
    formData.set('sortOrder', '2');
    formData.set(
      'thumbnailUrl',
      'https://media.example.com/thumbnails/lesson-123.png',
    );
    formData.set('thumbnailImageId', 'lesson-image-id');

    expect(parseLessonForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'What is React?',
        content: 'React is a UI library.',
        videoUrl: 'https://example.com/video',
        sortOrder: 2,
      },
    });
  });

  it('rejects missing lesson title', () => {
    const formData = new FormData();
    formData.set('content', 'Body');

    expect(parseLessonForm(formData)).toEqual({
      ok: false,
      error: 'Lesson title is required.',
    });
  });

  it('normalizes invalid sort order to zero', () => {
    const formData = new FormData();
    formData.set('title', 'Intro');
    formData.set('sortOrder', 'abc');

    expect(parseLessonForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'Intro',
        content: '',
        videoUrl: '',
        sortOrder: 0,
      },
    });
  });
});

describe('initial episode form parsing', () => {
  it('returns null when no first episode fields were supplied', () => {
    expect(parseInitialEpisodeForm(new FormData())).toEqual({
      ok: true,
      value: null,
    });
  });

  it('creates a first episode and defaults its title when only video exists', () => {
    const formData = new FormData();
    formData.set('videoUrl', 'https://media.example.com/videos/forest-01.mp4');
    formData.set('episodeContent', '숲에서 시작되는 첫 번째 이야기');

    expect(parseInitialEpisodeForm(formData)).toEqual({
      ok: true,
      value: {
        title: '1화',
        content: '숲에서 시작되는 첫 번째 이야기',
        videoUrl: 'https://media.example.com/videos/forest-01.mp4',
        sortOrder: 1,
      },
    });
  });

  it('creates episode metadata when a title is supplied before its video', () => {
    const formData = new FormData();
    formData.set('episodeTitle', '낯선 불빛');

    expect(parseInitialEpisodeForm(formData)).toEqual({
      ok: true,
      value: {
        title: '낯선 불빛',
        content: '',
        videoUrl: '',
        sortOrder: 1,
      },
    });
  });
});
