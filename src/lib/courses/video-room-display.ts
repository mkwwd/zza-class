import { getTapeDisplay, type TapeTone } from './course-display';
import { formatRuntimeLabel } from './course-runtime';
import { formatGenreLabels } from './genres';

export type VideoRoomSourceCourse = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  lessonCount: number;
  hasPlayableVideo: boolean;
  isEnrolled: boolean;
  genreLabels: string[];
  runtimeSeconds: number | null;
};

export type VideoRoomCard = {
  id: string;
  title: string;
  description: string;
  genreLabel: string;
  href?: string;
  isPlayable: boolean;
  runtimeLabel: string;
  shelfLabel: string;
  slotLabel: string;
  statusLabel: string;
  tapeCode: string;
  thumbnailUrl: string | null;
  tone: TapeTone;
  visualKind: 'cover' | 'coming-soon-tape';
};

export function buildVideoRoomCards(
  courses: VideoRoomSourceCourse[],
  minimumSlots = 7,
): VideoRoomCard[] {
  const courseCards = courses.map((course, index): VideoRoomCard => {
    const tape = getTapeDisplay({
      index,
      isEnrolled: course.isEnrolled,
      lessonCount: course.lessonCount,
      runtimeSeconds: course.runtimeSeconds,
    });
    const isPlayable = course.hasPlayableVideo;

    return {
      id: course.id,
      title: course.title,
      description: course.description || '시놉시스가 아직 준비 중입니다.',
      genreLabel: formatGenreLabels(course.genreLabels),
      href: isPlayable ? `/courses/${course.id}` : undefined,
      isPlayable,
      runtimeLabel: isPlayable
        ? formatRuntimeLabel(course.runtimeSeconds)
        : '편성 대기',
      shelfLabel: tape.shelfLabel,
      slotLabel: `VR-${String(index + 1).padStart(3, '0')}`,
      statusLabel: isPlayable ? '대여 가능' : '준비중',
      tapeCode: tape.code,
      thumbnailUrl: course.thumbnailUrl,
      tone: tape.tone,
      visualKind:
        isPlayable && course.thumbnailUrl ? 'cover' : 'coming-soon-tape',
    };
  });

  const placeholderCount = Math.max(0, minimumSlots - courseCards.length);
  const placeholders = Array.from({ length: placeholderCount }, (_, index) => {
    const slotIndex = courseCards.length + index;
    const tape = getTapeDisplay({
      index: slotIndex,
      lessonCount: 0,
      runtimeSeconds: null,
    });

    return {
      id: `coming-soon-${index + 1}`,
      title: '준비중',
      description: '새로운 숏드라마 테이프가 곧 들어옵니다.',
      genreLabel: 'COMING SOON',
      isPlayable: false,
      runtimeLabel: '편성 대기',
      shelfLabel: '입고 예정',
      slotLabel: `VR-${String(slotIndex + 1).padStart(3, '0')}`,
      statusLabel: '준비중',
      tapeCode: tape.code,
      thumbnailUrl: null,
      tone: tape.tone,
      visualKind: 'coming-soon-tape' as const,
    };
  });

  return [...courseCards, ...placeholders];
}

export function pickFeaturedVideoRoomCard(cards: VideoRoomCard[]) {
  return cards.find((card) => card.isPlayable) ?? cards[0] ?? null;
}
