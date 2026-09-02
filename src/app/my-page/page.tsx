import { Clock3, Play, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import styles from '@/app/video-room-pages.module.css';
import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { StaffCat, VideoCase } from '@/components/video-room/VideoRoomVisuals';
import { getUserProfile, requireUser } from '@/lib/auth/server';
import { partitionMyBagTitles } from '@/lib/courses/video-room-pages';

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
};

type LessonRow = {
  id: string;
  course_id: string;
  sort_order: number;
  title: string;
};

type BagTitle = CourseRow & {
  lessonIds: string[];
};

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const courseIds = (enrollments ?? []).map((item) => item.course_id);
  const { data: courses } = courseIds.length
    ? await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url')
        .in('id', courseIds)
    : { data: [] };
  const { data: lessons } = courseIds.length
    ? await supabase
        .from('lessons')
        .select('id, course_id, title, sort_order')
        .in('course_id', courseIds)
        .order('sort_order', { ascending: true })
    : { data: [] };
  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const { data: progress } = lessonIds.length
    ? await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)
    : { data: [] };

  const completedLessonIds = new Set(
    (progress ?? []).map((item) => item.lesson_id),
  );
  const lessonRows = (lessons ?? []) as LessonRow[];
  const titleRows: BagTitle[] = ((courses ?? []) as CourseRow[]).map(
    (course) => ({
      ...course,
      lessonIds: lessonRows
        .filter((lesson) => lesson.course_id === course.id)
        .map((lesson) => lesson.id),
    }),
  );
  const orderedTitles = courseIds
    .map((courseId) => titleRows.find((title) => title.id === courseId))
    .filter((title): title is BagTitle => Boolean(title));
  const sections = partitionMyBagTitles(orderedTitles, completedLessonIds);

  function getContinueHref(courseId: string) {
    const courseLessons = lessonRows.filter(
      (lesson) => lesson.course_id === courseId,
    );
    const nextLesson =
      courseLessons.find((lesson) => !completedLessonIds.has(lesson.id)) ??
      courseLessons[0];
    return nextLesson
      ? `/courses/${courseId}/lessons/${nextLesson.id}`
      : `/courses/${courseId}`;
  }

  return (
    <VideoRoomShell
      activeItem="my-page"
      bagCount={orderedTitles.length}
      isAdmin={profile.role === 'admin'}>
      <header className={styles.myPageHeader}>
        <div>
          <h1>MY BAG</h1>
          <p>빌린 비디오를 관리하고, 멈춘 장면부터 이어보세요.</p>
        </div>
        <span>
          <ShoppingBag aria-hidden="true" size={18} /> {orderedTitles.length}{' '}
          TITLES
        </span>
      </header>

      <main className={styles.myPageContent}>
        <BagSection
          emptyMessage="아직 대여 중인 작품이 없어요."
          getContinueHref={getContinueHref}
          lessons={lessonRows}
          title="대여 중"
          titles={sections.rented}
          variant="rented"
        />
        <BagSection
          emptyMessage="끝까지 본 작품이 이곳에 차곡차곡 쌓여요."
          getContinueHref={getContinueHref}
          lessons={lessonRows}
          title="시청 완료"
          titles={sections.completed}
          variant="completed"
        />

        <aside className={styles.bagFooter}>
          <StaffCat className={styles.bagCat} />
          <div>
            <strong>다음 이야기를 찾고 있나요?</strong>
            <p>
              새로 들어온 테이프와 준비 중인 작품을 VIDEO ROOM에서 확인해
              보세요.
            </p>
          </div>
          <Link href="/main">새로운 작품 보러가기</Link>
        </aside>
      </main>
    </VideoRoomShell>
  );
}

function BagSection({
  emptyMessage,
  getContinueHref,
  lessons,
  title,
  titles,
  variant,
}: {
  emptyMessage: string;
  getContinueHref: (courseId: string) => string;
  lessons: LessonRow[];
  title: string;
  titles: BagTitle[];
  variant: 'rented' | 'completed';
}) {
  return (
    <section className={styles.bagSection}>
      <div className={styles.sectionTitleRow}>
        <div>
          <h2>{title}</h2>
          <p>{titles.length}개의 비디오</p>
        </div>
      </div>
      {titles.length ? (
        <div
          className={
            variant === 'rented' ? styles.rentedGrid : styles.completedGrid
          }>
          {titles.map((course) => {
            const episodeCount = lessons.filter(
              (lesson) => lesson.course_id === course.id,
            ).length;
            return (
              <article className={styles.bagCard} key={course.id}>
                <VideoCase
                  runtime={episodeCount ? `${episodeCount}화` : '편성 대기'}
                  thumbnailUrl={course.thumbnail_url}
                  title={course.title}
                />
                <div className={styles.bagCardCopy}>
                  <h3>{course.title}</h3>
                  <span>
                    <Clock3 aria-hidden="true" size={14} /> {episodeCount}{' '}
                    EPISODES
                  </span>
                  <p>{course.description || '작품 소개가 준비 중입니다.'}</p>
                  <div>
                    <Link
                      className={styles.cardPrimary}
                      href={getContinueHref(course.id)}>
                      <Play aria-hidden="true" fill="currentColor" size={15} />
                      {variant === 'rented' ? '이어보기' : '다시 보기'}
                    </Link>
                    <Link
                      className={styles.cardSecondary}
                      href={`/courses/${course.id}`}>
                      상세정보
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.bagEmpty}>
          <ShoppingBag aria-hidden="true" size={24} />
          <p>{emptyMessage}</p>
          <Link href="/main">VIDEO ROOM 둘러보기</Link>
        </div>
      )}
    </section>
  );
}
