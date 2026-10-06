import { parseGenreSlugs } from './genres';
import type { CourseFormInput, CourseStatus, LessonFormInput } from './types';

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function readStatus(formData: FormData): CourseStatus {
  return readString(formData, 'status') === 'published' ? 'published' : 'draft';
}

export function parseCourseForm(
  formData: FormData,
): ParseResult<CourseFormInput> {
  const title = readString(formData, 'title');

  if (!title) {
    return { ok: false, error: 'Course title is required.' };
  }

  const genres = parseGenreSlugs(formData.getAll('genres'));

  if (!genres.ok) {
    return genres;
  }

  return {
    ok: true,
    value: {
      title,
      description: readString(formData, 'description'),
      staffNote: readString(formData, 'staffNote'),
      status: readStatus(formData),
      thumbnailUrl: readString(formData, 'thumbnailUrl'),
      thumbnailImageId: readString(formData, 'thumbnailImageId'),
      genreSlugs: genres.value,
    },
  };
}

export function parseLessonForm(
  formData: FormData,
): ParseResult<LessonFormInput> {
  const title = readString(formData, 'title');

  if (!title) {
    return { ok: false, error: 'Lesson title is required.' };
  }

  const sortOrder = Number.parseInt(readString(formData, 'sortOrder'), 10);
  const durationValue = readString(formData, 'durationSeconds');
  const durationSeconds = durationValue === '' ? null : Number(durationValue);

  if (
    durationSeconds !== null &&
    (!Number.isInteger(durationSeconds) || durationSeconds < 0)
  ) {
    return { ok: false, error: 'Lesson duration must be whole seconds.' };
  }

  return {
    ok: true,
    value: {
      title,
      content: readString(formData, 'content'),
      videoUrl: readString(formData, 'videoUrl'),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      durationSeconds,
    },
  };
}
