import {
  formatRuntimeLabel,
  sumPlayableRuntimeSeconds,
} from './course-runtime';

export type PublicLessonMetadata = {
  id: string;
  duration_seconds: number | null;
  has_video: boolean;
  sort_order?: number;
};

export type PublicCourseGenreRow = {
  genres: { label_en: string } | { label_en: string }[] | null;
};

type PublicCoursePlayback =
  | {
      firstPlayableLessonId: null;
      hasPlayableVideo: false;
      runtimeLabel: '편성 대기';
      runtimeSeconds: null;
    }
  | {
      firstPlayableLessonId: string;
      hasPlayableVideo: true;
      runtimeLabel: string;
      runtimeSeconds: number | null;
    };

export function getCoursePreviewHref({
  courseId,
  hasUploadedPreview,
  lessons,
}: {
  courseId: string;
  hasUploadedPreview: boolean;
  lessons: PublicLessonMetadata[];
}) {
  if (hasUploadedPreview) return `/courses/${courseId}/preview`;

  const firstEpisode = lessons.find(
    (lesson) => lesson.sort_order === 1 && lesson.has_video,
  );

  return firstEpisode
    ? `/courses/${courseId}/lessons/${firstEpisode.id}`
    : null;
}

export function getPublicCoursePlayback(
  lessons: PublicLessonMetadata[],
): PublicCoursePlayback {
  const playableLessons = lessons.filter((lesson) => lesson.has_video);

  if (playableLessons.length === 0) {
    return {
      firstPlayableLessonId: null,
      hasPlayableVideo: false,
      runtimeLabel: '편성 대기',
      runtimeSeconds: null,
    };
  }

  const runtimeSeconds = sumPlayableRuntimeSeconds(
    playableLessons.map((lesson) => lesson.duration_seconds),
  );

  return {
    firstPlayableLessonId: playableLessons[0].id,
    hasPlayableVideo: true,
    runtimeLabel: formatRuntimeLabel(runtimeSeconds),
    runtimeSeconds,
  };
}

export function getLessonPlaybackHref({
  courseId,
  isRented,
  lesson,
}: {
  courseId: string;
  isRented: boolean;
  lesson: PublicLessonMetadata;
}): string | null {
  return lesson.has_video && (lesson.sort_order === 1 || isRented)
    ? `/courses/${courseId}/lessons/${lesson.id}`
    : null;
}

export function getCourseGenreLabels(
  courseGenres: PublicCourseGenreRow[],
): string[] {
  return courseGenres.flatMap((courseGenre) => {
    const genre = Array.isArray(courseGenre.genres)
      ? courseGenre.genres[0]
      : courseGenre.genres;

    return genre ? [genre.label_en] : [];
  });
}
