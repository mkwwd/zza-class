import type { CourseStatus } from './types';

export function formatCourseStatus(status: CourseStatus) {
  return status === 'published' ? '공개' : '비공개';
}

const tapeTones = ['amber', 'cyan', 'rose', 'violet'] as const;

export type TapeTone = (typeof tapeTones)[number];

export type TapeDisplay = {
  code: string;
  episodeLabel: string;
  runtimeLabel: string;
  shelfLabel: string;
  tone: TapeTone;
};

type TapeDisplayInput = {
  index: number;
  isEnrolled?: boolean;
  lessonCount: number;
};

export function getTapeDisplay({
  index,
  isEnrolled = false,
  lessonCount,
}: TapeDisplayInput): TapeDisplay {
  const normalizedLessonCount = Math.max(0, lessonCount);

  return {
    code: `TAPE ${String(index + 1).padStart(3, '0')}`,
    episodeLabel: normalizedLessonCount
      ? `${normalizedLessonCount}화`
      : '준비 중',
    runtimeLabel: normalizedLessonCount
      ? `약 ${normalizedLessonCount * 6}분`
      : '편성 대기',
    shelfLabel: isEnrolled ? '보관 중' : '대여 가능',
    tone: tapeTones[index % tapeTones.length],
  };
}
