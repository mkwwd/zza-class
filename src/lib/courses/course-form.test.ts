import { describe, expect, it } from 'vitest';

import { parseCourseForm, parseLessonForm } from './course-form';

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
    formData.append('genres', 'drama');
    formData.append('genres', 'fantasy');

    expect(parseCourseForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'React Basics',
        description: 'Start learning React.',
        staffNote: '불을 낮추고 천천히 감상해 보세요.',
        status: 'published',
        thumbnailUrl: 'https://media.example.com/thumbnails/course-123.png',
        thumbnailImageId: 'course-image-id',
        genreSlugs: ['drama', 'fantasy'],
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
        genreSlugs: [],
      },
    });
  });

  it('rejects more than two selected genres', () => {
    const formData = new FormData();
    formData.set('title', 'React Basics');
    formData.append('genres', 'drama');
    formData.append('genres', 'fantasy');
    formData.append('genres', 'romance');

    expect(parseCourseForm(formData).ok).toBe(false);
  });

  it('rejects a genre outside the fixed catalog', () => {
    const formData = new FormData();
    formData.set('title', 'React Basics');
    formData.append('genres', 'documentary');

    expect(parseCourseForm(formData).ok).toBe(false);
  });
});

describe('lesson form parsing', () => {
  it('accepts valid lesson data', () => {
    const formData = new FormData();
    formData.set('title', 'What is React?');
    formData.set('content', 'React is a UI library.');
    formData.set('videoUrl', 'https://example.com/video');
    formData.set('sortOrder', '2');
    formData.set('durationSeconds', '146');
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
        durationSeconds: 146,
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
        durationSeconds: null,
      },
    });
  });

  it('treats an empty duration as missing metadata', () => {
    const formData = new FormData();
    formData.set('title', 'Intro');
    formData.set('durationSeconds', '');

    expect(parseLessonForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'Intro',
        content: '',
        videoUrl: '',
        sortOrder: 0,
        durationSeconds: null,
      },
    });
  });

  it('rejects a negative duration', () => {
    const formData = new FormData();
    formData.set('title', 'Intro');
    formData.set('durationSeconds', '-1');

    expect(parseLessonForm(formData).ok).toBe(false);
  });

  it('rejects a malformed duration', () => {
    const formData = new FormData();
    formData.set('title', 'Intro');
    formData.set('durationSeconds', '2.5');

    expect(parseLessonForm(formData).ok).toBe(false);
  });
});
