export type CourseStatus = 'draft' | 'published';

export type CourseFormInput = {
  title: string;
  description: string;
  status: CourseStatus;
  thumbnailUrl: string;
  thumbnailImageId: string;
};

export type LessonFormInput = {
  title: string;
  content: string;
  videoUrl: string;
  sortOrder: number;
  thumbnailUrl: string;
  thumbnailImageId: string;
};

export type InitialEpisodeFormInput = Pick<
  LessonFormInput,
  'title' | 'content' | 'videoUrl' | 'sortOrder'
>;
