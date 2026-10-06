import type { GenreSlug } from './genres';

export type CourseStatus = 'draft' | 'published';

export type CourseFormInput = {
  title: string;
  description: string;
  staffNote: string;
  status: CourseStatus;
  thumbnailUrl: string;
  thumbnailImageId: string;
  genreSlugs: GenreSlug[];
};

export type LessonFormInput = {
  title: string;
  content: string;
  videoUrl: string;
  sortOrder: number;
  durationSeconds: number | null;
};
