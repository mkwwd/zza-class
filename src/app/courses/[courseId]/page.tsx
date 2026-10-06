import {
  ArrowLeft,
  Clock3,
  Heart,
  Info,
  Play,
  Search,
  Share2,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import styles from '@/app/video-room-pages.module.css';
import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import {
  StaffCat,
  VideoCase,
  VhsTape,
} from '@/components/video-room/VideoRoomVisuals';
import { getUserProfile } from '@/lib/auth/server';
import { getTapeDisplay } from '@/lib/courses/course-display';
import { formatGenreLabels } from '@/lib/courses/genres';
import {
  getCourseGenreLabels,
  getLessonPlaybackHref,
  getPublicCoursePlayback,
  type PublicCourseGenreRow,
  type PublicLessonMetadata,
} from '@/lib/courses/public-course-metadata';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

import { enrollInCourse } from '../actions';

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

type LessonRow = PublicLessonMetadata & {
  title: string;
  sort_order: number;
};

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  if (!hasSupabaseEnv()) {
    return <SetupState message="Supabase 연결 후 작품 정보를 볼 수 있어요." />;
  }

  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUserProfile(supabase, user.id) : null;
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description, staff_note, status, thumbnail_url')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    throw new Error('Failed to load video details.');
  }

  if (!course) notFound();

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, sort_order, duration_seconds, has_video')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });
  const { data: courseGenres, error: courseGenresError } = await supabase
    .from('course_genres')
    .select('position, genres(label_en)')
    .eq('course_id', course.id)
    .order('position', { ascending: true });

  if (lessonsError || courseGenresError) {
    throw new Error('Failed to load public video metadata.');
  }

  const { data: enrollment } = user
    ? await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', course.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };
  const { count: bagCount } = user
    ? await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
    : { count: 0 };

  const courseLessons = (lessons ?? []) as LessonRow[];
  const lessonCount = courseLessons.length;
  const playback = getPublicCoursePlayback(courseLessons);
  const genreLabel = formatGenreLabels(
    getCourseGenreLabels((courseGenres ?? []) as PublicCourseGenreRow[]),
  );
  const tape = getTapeDisplay({
    index: 0,
    hasPlayableVideo: playback.hasPlayableVideo,
    isEnrolled: Boolean(enrollment),
    lessonCount,
    runtimeSeconds: playback.runtimeSeconds,
  });

  return (
    <VideoRoomShell
      activeItem="catalog"
      bagCount={bagCount ?? 0}
      isAdmin={profile?.role === 'admin'}
      showStaffCat={false}>
      <header className={styles.utilityBar}>
        <Link className={styles.backLink} href="/main">
          <ArrowLeft aria-hidden="true" size={18} />
          VIDEO ROOM으로
        </Link>
        <div className={styles.utilityActions}>
          <Link
            aria-label="작품 검색"
            className={styles.iconAction}
            href="/main">
            <Search aria-hidden="true" size={19} />
          </Link>
          <Link className={styles.bagAction} href={user ? '/my-page' : '/'}>
            <ShoppingBag aria-hidden="true" size={18} />
            MY BAG ({bagCount ?? 0})
          </Link>
        </div>
      </header>

      <main className={styles.detailPage}>
        <section className={styles.detailHero}>
          <div className={styles.detailArtwork}>
            <VideoCase
              runtime={tape.runtimeLabel}
              thumbnailUrl={course.thumbnail_url}
              title={course.title}
            />
          </div>

          <div className={styles.detailCopy}>
            <h1>{course.title}</h1>
            <p className={styles.detailSubtitle}>VIDEO ROOM ORIGINAL</p>
            <div className={styles.detailMeta}>
              <span>{genreLabel}</span>
              <span>{tape.episodeLabel}</span>
              <span>{tape.runtimeLabel}</span>
              <span>
                {playback.hasPlayableVideo && course.status === 'published'
                  ? '대여 가능'
                  : '편성 대기'}
              </span>
            </div>
            <p className={styles.synopsis}>
              {course.description || '작품 소개가 아직 준비되지 않았어요.'}
            </p>

            <div className={styles.detailButtons}>
              {!playback.hasPlayableVideo ? (
                <span className={styles.disabledButton}>회차 준비중</span>
              ) : user ? (
                enrollment ? (
                  <Link
                    className={styles.primaryButton}
                    href={`/courses/${course.id}/lessons/${playback.firstPlayableLessonId}`}>
                    <Play aria-hidden="true" fill="currentColor" size={19} />첫
                    회차 재생
                  </Link>
                ) : (
                  <form action={enrollInCourse.bind(null, course.id)}>
                    <button className={styles.primaryButton} type="submit">
                      <ShoppingBag aria-hidden="true" size={19} />
                      MY BAG 담기
                    </button>
                  </form>
                )
              ) : (
                <Link className={styles.primaryButton} href="/">
                  로그인하고 대여하기
                </Link>
              )}
              <button className={styles.secondaryButton} type="button">
                <Heart aria-hidden="true" size={19} />
                찜하기
              </button>
            </div>

            <div className={styles.detailHints}>
              <span>
                <Info aria-hidden="true" size={16} />
                보관함에서 언제든 이어볼 수 있어요.
              </span>
              <button aria-label="작품 공유" type="button">
                <Share2 aria-hidden="true" size={17} /> 공유
              </button>
            </div>

            <aside className={styles.staffPick}>
              <StaffCat className={styles.detailCat} priority />
              <div>
                <strong>Staff 리코의 한마디</strong>
                <p>
                  {course.staff_note ||
                    '조명을 조금 낮추고 편안한 자리에서 감상해 보세요.'}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.episodeSection}>
          <div className={styles.sectionTitleRow}>
            <div>
              <h2>회차 선택</h2>
              <p>테이프 안에 담긴 이야기를 순서대로 만나보세요.</p>
            </div>
            <span>{lessonCount} EPISODES</span>
          </div>

          {courseLessons.length ? (
            <ol className={styles.episodeGrid}>
              {courseLessons.map((lesson, index) => {
                const lessonHref = getLessonPlaybackHref({
                  courseId: course.id,
                  isEnrolled: Boolean(enrollment),
                  lesson,
                });
                const content = (
                  <>
                    <div className={styles.episodeVisual}>
                      <VhsTape
                        code={`EPISODE ${String(lesson.sort_order).padStart(2, '0')}`}
                        label={`${lesson.sort_order}회`}
                        orientation="horizontal"
                      />
                    </div>
                    <div className={styles.episodeCopy}>
                      <span>
                        EPISODE {String(lesson.sort_order).padStart(2, '0')}
                      </span>
                      <h3>{lesson.title}</h3>
                      <small>
                        <Clock3 aria-hidden="true" size={14} />{' '}
                        {lesson.has_video ? 'SHORT VIDEO' : '편성 대기'}
                      </small>
                    </div>
                  </>
                );

                return (
                  <li key={lesson.id}>
                    {lessonHref ? (
                      <Link href={lessonHref}>{content}</Link>
                    ) : (
                      <div
                        aria-label={
                          lesson.has_video
                            ? `${index + 1}화, 대여 후 재생 가능`
                            : `${index + 1}화, 영상 편성 대기`
                        }>
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className={styles.emptyShelf}>
              <VhsTape code="VR-WAIT" label="준비중" />
              <div>
                <h3>아직 편성된 회차가 없어요.</h3>
                <p>새로운 이야기가 들어오면 이 선반에 가장 먼저 놓아둘게요.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </VideoRoomShell>
  );
}

function SetupState({ message }: { message: string }) {
  return (
    <main className={styles.setupState}>
      <VhsTape code="SETUP" label="연결 대기" />
      <p>{message}</p>
    </main>
  );
}
