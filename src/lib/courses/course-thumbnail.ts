export type CourseThumbnailSource = {
  id: string;
  thumbnail_image_id?: string | null;
  thumbnail_url?: string | null;
};

export function getCourseThumbnailSrc(course: CourseThumbnailSource) {
  if (course.thumbnail_image_id) {
    return `/api/images/courses/${encodeURIComponent(course.id)}`;
  }

  return course.thumbnail_url || null;
}
