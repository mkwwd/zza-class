import type {
  CourseFormInput,
  CourseStatus,
  InitialEpisodeFormInput,
  LessonFormInput,
} from './types';

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function readStatus(formData: FormData): CourseStatus {
  return readString(formData, 'status') === 'published' ? 'published' : 'draft';
}

export function parseCourseForm(
  formData: FormData,
): { ok: true; value: CourseFormInput } | { ok: false; error: string } {
  const title = readString(formData, 'title');

  if (!title) {
    return { ok: false, error: 'Course title is required.' };
  }

  return {
    ok: true,
    value: {
      title,
      description: readString(formData, 'description'),
      status: readStatus(formData),
      thumbnailUrl: readString(formData, 'thumbnailUrl'),
      thumbnailImageId: readString(formData, 'thumbnailImageId'),
    },
  };
}

export function parseLessonForm(
  formData: FormData,
): { ok: true; value: LessonFormInput } | { ok: false; error: string } {
  const title = readString(formData, 'title');

  if (!title) {
    return { ok: false, error: 'Lesson title is required.' };
  }

  const sortOrder = Number.parseInt(readString(formData, 'sortOrder'), 10);

  return {
    ok: true,
    value: {
      title,
      content: readString(formData, 'content'),
      videoUrl: readString(formData, 'videoUrl'),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  };
}

export function parseInitialEpisodeForm(
  formData: FormData,
):
  | { ok: true; value: InitialEpisodeFormInput | null }
  | { ok: false; error: string } {
  const suppliedTitle = readString(formData, 'episodeTitle');
  const videoUrl = readString(formData, 'videoUrl');
  const content = readString(formData, 'episodeContent');

  if (!suppliedTitle && !videoUrl && !content) {
    return { ok: true, value: null };
  }

  return {
    ok: true,
    value: {
      title: suppliedTitle || '1화',
      content,
      videoUrl,
      sortOrder: 1,
    },
  };
}
