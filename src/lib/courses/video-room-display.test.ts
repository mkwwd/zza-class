import { describe, expect, it } from 'vitest';

import {
  buildVideoRoomCards,
  pickFeaturedVideoRoomCard,
} from './video-room-display';

describe('buildVideoRoomCards', () => {
  it('marks courses without playable video as coming soon VHS tapes', () => {
    const [card] = buildVideoRoomCards(
      [
        {
          id: 'course-1',
          title: '달의 뒷면',
          description: '달빛 아래 시작되는 짧은 이야기',
          thumbnailUrl: 'https://media.example.com/moon.png',
          lessonCount: 2,
          hasPlayableVideo: false,
          isEnrolled: false,
          genreLabels: ['DRAMA'],
          runtimeSeconds: 188,
        },
      ],
      1,
    );

    expect(card).toMatchObject({
      id: 'course-1',
      title: '달의 뒷면',
      statusLabel: '준비중',
      isPlayable: false,
      href: undefined,
      visualKind: 'coming-soon-tape',
      runtimeLabel: '편성 대기',
    });
  });

  it('preserves stored genre order and displays exact playable runtime', () => {
    const [card] = buildVideoRoomCards(
      [
        {
          id: 'course-1',
          title: '달의 뒷면',
          description: null,
          thumbnailUrl: null,
          lessonCount: 2,
          hasPlayableVideo: true,
          isEnrolled: false,
          genreLabels: ['THRILLER', 'FANTASY'],
          runtimeSeconds: 188,
        },
      ],
      1,
    );

    expect(card.genreLabel).toBe('THRILLER · FANTASY');
    expect(card.runtimeLabel).toBe('3분 8초');
  });

  it('uses metadata fallbacks for playable courses with incomplete data', () => {
    const [card] = buildVideoRoomCards(
      [
        {
          id: 'course-1',
          title: '장르 없는 작품',
          description: null,
          thumbnailUrl: null,
          lessonCount: 1,
          hasPlayableVideo: true,
          isEnrolled: false,
          genreLabels: [],
          runtimeSeconds: null,
        },
      ],
      1,
    );

    expect(card.genreLabel).toBe('장르 미등록');
    expect(card.runtimeLabel).toBe('시간 미등록');
  });

  it('fills empty shelf slots with coming soon VHS tapes', () => {
    const cards = buildVideoRoomCards([], 3);

    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.visualKind)).toEqual([
      'coming-soon-tape',
      'coming-soon-tape',
      'coming-soon-tape',
    ]);
    expect(cards[0]).toMatchObject({
      id: 'coming-soon-1',
      title: '준비중',
      statusLabel: '준비중',
      isPlayable: false,
    });
  });

  it('keeps seven VHS positions on the default new-release shelf', () => {
    const cards = buildVideoRoomCards([]);

    expect(cards).toHaveLength(7);
    expect(cards.every((card) => card.statusLabel === '준비중')).toBe(true);
  });
});

describe('pickFeaturedVideoRoomCard', () => {
  it('prefers the first playable card for the featured shelf', () => {
    const cards = buildVideoRoomCards(
      [
        {
          id: 'course-1',
          title: '편성 대기작',
          description: null,
          thumbnailUrl: null,
          lessonCount: 0,
          hasPlayableVideo: false,
          isEnrolled: false,
          genreLabels: [],
          runtimeSeconds: null,
        },
        {
          id: 'course-2',
          title: '오늘 밤 산책자',
          description: null,
          thumbnailUrl: null,
          lessonCount: 4,
          hasPlayableVideo: true,
          isEnrolled: true,
          genreLabels: ['DRAMA', 'ROMANCE'],
          runtimeSeconds: 245,
        },
      ],
      2,
    );

    expect(pickFeaturedVideoRoomCard(cards)?.id).toBe('course-2');
  });
});
