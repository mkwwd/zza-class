import {
  ChevronRight,
  Film,
  LibraryBig,
  LogOut,
  Clapperboard,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin as checkIsAdmin } from '@/lib/auth/access';
import {
  getCourseGenreLabels,
  getPublicCoursePlayback,
  type PublicCourseGenreRow,
  type PublicLessonMetadata,
} from '@/lib/courses/public-course-metadata';
import {
  buildVideoRoomCards,
  pickFeaturedVideoRoomCard,
  type VideoRoomCard,
} from '@/lib/courses/video-room-display';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

import { logout } from '../actions';

import { CatSearchCounter } from './cat-search-counter';
import styles from './video-room.module.css';

export const dynamic = 'force-dynamic';

type MainPageProps = {
  searchParams: Promise<{ q?: string }>;
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
};

type LessonRow = PublicLessonMetadata & {
  course_id: string;
};

type CourseGenreRow = PublicCourseGenreRow & {
  course_id: string;
};

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navigationItems: NavigationItem[] = [
  { href: '/main', icon: Film, label: '홈' },
  { href: '/my-page', icon: LibraryBig, label: '마이 페이지' },
];

function VhsTape({
  card,
  compact = false,
}: {
  card: VideoRoomCard;
  compact?: boolean;
}) {
  return (
    <div className={`${styles.vhsTape} ${compact ? styles.compactTape : ''}`}>
      <Image
        alt=""
        className={styles.tapeImage}
        fill
        sizes={compact ? '96px' : '(max-width: 760px) 360px, 680px'}
        src="/images/vhs-tape.png"
      />
      <span className={styles.tapeLabel}>
        <strong>{card.statusLabel}</strong>
        <small>{card.slotLabel}</small>
      </span>
    </div>
  );
}

function CoverCase({ card }: { card: VideoRoomCard }) {
  return (
    <div className={styles.coverCase}>
      <div className={styles.coverSpine} aria-hidden="true">
        <span>{card.tapeCode}</span>
      </div>
      <div
        aria-label={`${card.title} 작품 표지`}
        className={styles.coverArtwork}
        role="img"
        style={{ backgroundImage: `url(${card.thumbnailUrl})` }}>
        <span className={styles.coverShade} />
        <strong>{card.title}</strong>
        <small>{card.runtimeLabel}</small>
      </div>
    </div>
  );
}

function ReleaseCard({ card }: { card: VideoRoomCard }) {
  const visual =
    card.visualKind === 'cover' && card.thumbnailUrl ? (
      <CoverCase card={card} />
    ) : (
      <VhsTape card={card} />
    );

  return card.href ? (
    <Link
      className={styles.releaseCard}
      href={card.href}
      aria-label={`${card.title} 보기`}>
      {visual}
    </Link>
  ) : (
    <div
      className={`${styles.releaseCard} ${styles.disabled}`}
      aria-label={`${card.title} 준비중`}>
      {visual}
    </div>
  );
}

function RankingCard({ card, rank }: { card: VideoRoomCard; rank: number }) {
  const content = (
    <>
      <span className={styles.rankNumber}>{rank}</span>
      <div className={styles.rankThumb}>
        {card.visualKind === 'cover' && card.thumbnailUrl ? (
          <div
            className={styles.rankArtwork}
            role="img"
            aria-label={`${card.title} 썸네일`}
            style={{ backgroundImage: `url(${card.thumbnailUrl})` }}
          />
        ) : (
          <VhsTape card={card} compact />
        )}
      </div>
      <div className={styles.rankCopy}>
        <strong>{card.title}</strong>
        <span>
          {card.genreLabel} · {card.runtimeLabel}
        </span>
      </div>
    </>
  );

  return card.href ? (
    <Link className={styles.rankingCard} href={card.href}>
      {content}
    </Link>
  ) : (
    <div className={`${styles.rankingCard} ${styles.disabled}`}>{content}</div>
  );
}

function FeaturedCard({ card }: { card: VideoRoomCard }) {
  return (
    <section className={styles.featured} aria-label="오늘의 추천 비디오">
      <div className={styles.featuredMedia}>
        {card.visualKind === 'cover' && card.thumbnailUrl ? (
          <CoverCase card={card} />
        ) : (
          <VhsTape card={card} />
        )}
      </div>
      <div className={styles.featuredCopy}>
        <span className={styles.featuredLabel}>FEATURED</span>
        <h2>{card.title}</h2>
        <span className={styles.featuredMeta}>
          {card.genreLabel} · {card.runtimeLabel}
        </span>
        <p>{card.description}</p>
        {card.href ? (
          <Link className={styles.rentButton} href={card.href}>
            대여하기
          </Link>
        ) : (
          <span className={`${styles.rentButton} ${styles.disabledButton}`}>
            준비중
          </span>
        )}
      </div>
    </section>
  );
}

export default async function MainPage({ searchParams }: MainPageProps) {
  if (!hasSupabaseEnv()) redirect('/');

  const { q } = await searchParams;
  const searchQuery = q?.trim() ?? '';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('id', user.id)
    .maybeSingle();
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (coursesError) {
    throw new Error('Failed to load published videos.');
  }

  const courseIds = (courses ?? []).map((course) => course.id);
  const [lessonResult, genreResult] = courseIds.length
    ? await Promise.all([
        supabase
          .from('lessons')
          .select('id, course_id, duration_seconds, has_video')
          .in('course_id', courseIds),
        supabase
          .from('course_genres')
          .select('course_id, position, genres(label_en)')
          .in('course_id', courseIds)
          .order('position', { ascending: true }),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];

  if (lessonResult.error || genreResult.error) {
    throw new Error('Failed to load public video metadata.');
  }

  const lessons = (lessonResult.data ?? []) as LessonRow[];
  const courseGenres = (genreResult.data ?? []) as CourseGenreRow[];

  const enrolledCourseIds = new Set(
    (enrollments ?? []).map((item) => item.course_id),
  );
  const lessonsByCourseId = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const courseLessons = lessonsByCourseId.get(lesson.course_id) ?? [];
    courseLessons.push(lesson);
    lessonsByCourseId.set(lesson.course_id, courseLessons);
  }

  const genreLabelsByCourseId = new Map<string, string[]>();
  for (const courseGenre of courseGenres) {
    const [genreLabel] = getCourseGenreLabels([courseGenre]);

    if (!genreLabel) continue;

    const labels = genreLabelsByCourseId.get(courseGenre.course_id) ?? [];
    labels.push(genreLabel);
    genreLabelsByCourseId.set(courseGenre.course_id, labels);
  }

  const keyword = searchQuery.toLowerCase();
  const visibleCourses = ((courses ?? []) as CourseRow[]).filter(
    (course) =>
      !keyword ||
      course.title.toLowerCase().includes(keyword) ||
      (course.description ?? '').toLowerCase().includes(keyword),
  );
  const cards = buildVideoRoomCards(
    visibleCourses.map((course) => {
      const courseLessons = lessonsByCourseId.get(course.id) ?? [];
      const playback = getPublicCoursePlayback(courseLessons);

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail_url,
        lessonCount: courseLessons.length,
        hasPlayableVideo: playback.hasPlayableVideo,
        isEnrolled: enrolledCourseIds.has(course.id),
        genreLabels: genreLabelsByCourseId.get(course.id) ?? [],
        runtimeSeconds: playback.runtimeSeconds,
      };
    }),
  );
  const featuredCard = pickFeaturedVideoRoomCard(cards);
  const isAdmin = checkIsAdmin(profile?.role === 'admin' ? 'admin' : 'user');

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/main" aria-label="Video Room 홈">
          <span>VIDEO ROOM</span>
          <small>SHORT VIDEO RENTAL SHOP</small>
        </Link>

        <nav className={styles.navigation} aria-label="비디오룸 메뉴">
          {navigationItems.map(({ href, icon: Icon, label }, index) => (
            <Link
              className={index === 0 ? styles.activeNav : undefined}
              href={href}
              key={label}>
              <Icon aria-hidden="true" size={21} strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          ))}
          {isAdmin ? (
            <Link href="/admin">
              <Clapperboard aria-hidden="true" size={21} strokeWidth={1.7} />
              <span>편집실</span>
            </Link>
          ) : null}
        </nav>

        <div className={styles.sidebarWelcome}>
          <strong>VIDEO ROOM</strong>
          <p>비디오룸에 오신 것을 환영합니다.</p>
          <p>찾는 작품이 있다면 카운터에 문의해주세요.</p>
          <span className={styles.miniLamp} aria-hidden="true" />
        </div>

        <form action={logout}>
          <button className={styles.logout} type="submit">
            <LogOut aria-hidden="true" size={18} strokeWidth={1.7} />
            로그아웃
          </button>
        </form>
      </aside>

      <div className={styles.mainContent}>
        <section className={styles.hero}>
          <CatSearchCounter initialQuery={searchQuery} />
          {featuredCard ? <FeaturedCard card={featuredCard} /> : null}
        </section>

        <section className={styles.releaseSection}>
          <div className={styles.sectionHeading}>
            <h2>새로운 작품</h2>
            <Link href="/courses">
              더보기 <ChevronRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <div className={styles.woodShelf}>
            <div className={styles.releaseGrid}>
              {cards.slice(0, 7).map((card) => (
                <ReleaseCard card={card} key={card.id} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.popularSection}>
          <div className={styles.sectionHeading}>
            <h2>인기 작품</h2>
            <Link href="/courses">
              더보기 <ChevronRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <div className={styles.rankingGrid}>
            {cards.slice(0, 5).map((card, index) => (
              <RankingCard card={card} key={card.id} rank={index + 1} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
