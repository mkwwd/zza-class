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
import { getCourseThumbnailSrc } from '@/lib/courses/course-thumbnail';
import { formatGenreLabels } from '@/lib/courses/genres';
import {
  getCourseGenreLabels,
  getCoursePreviewHref,
  getLessonPlaybackHref,
  getPublicCoursePlayback,
  type PublicCourseGenreRow,
  type PublicLessonMetadata,
} from '@/lib/courses/public-course-metadata';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

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
    .select(
      'id, title, description, staff_note, status, thumbnail_image_id, thumbnail_url, preview_video_object_key',
    )
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

  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const { data: rentals } =
    user && lessonIds.length
      ? await supabase
          .from('lesson_rentals')
          .select('lesson_id')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)
      : { data: [] };
  const { count: bagCount } = user
    ? await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
    : { count: 0 };

  const courseLessons = (lessons ?? []) as LessonRow[];
  const rentedLessonIds = new Set(
    (rentals ?? []).map((rental) => rental.lesson_id),
  );
  const lessonCount = courseLessons.length;
  const playback = getPublicCoursePlayback(courseLessons);
  const previewHref = getCoursePreviewHref({
    courseId: course.id,
    hasUploadedPreview: Boolean(course.preview_video_object_key),
    lessons: courseLessons,
  });
  const hasLockedPaidEpisodes = courseLessons.some(
    (lesson) =>
      lesson.sort_order > 1 &&
      lesson.has_video &&
      !rentedLessonIds.has(lesson.id),
  );
  const genreLabel = formatGenreLabels(
    getCourseGenreLabels((courseGenres ?? []) as PublicCourseGenreRow[]),
  );
  const tape = getTapeDisplay({
    index: 0,
    hasPlayableVideo: playback.hasPlayableVideo,
    isEnrolled: rentedLessonIds.size > 0,
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
              thumbnailUrl={getCourseThumbnailSrc(course)}
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
              {!previewHref ? (
                <span className={styles.disabledButton}>회차 준비중</span>
              ) : (
                <Link className={styles.primaryButton} href={previewHref}>
                  <Play aria-hidden="true" fill="currentColor" size={19} />
                  미리보기
                </Link>
              )}
              {hasLockedPaidEpisodes ? (
                <span className={styles.disabledButton}>
                  <ShoppingBag aria-hidden="true" size={19} /> 회차 대여 준비 중
                </span>
              ) : null}
              <button className={styles.secondaryButton} type="button">
                <Heart aria-hidden="true" size={19} />
                찜하기
              </button>
            </div>

            <div className={styles.detailHints}>
              <span>
                <Info aria-hidden="true" size={16} />
                1화는 미리보기로 공개되며, 이후 회차는 개별 대여합니다.
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
                  isRented: rentedLessonIds.has(lesson.id),
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
                        {!lesson.has_video
                          ? '편성 대기'
                          : lesson.sort_order === 1
                            ? '무료 미리보기'
                            : rentedLessonIds.has(lesson.id)
                              ? '대여 완료'
                              : '유료 대여 준비 중'}
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
                            ? `${index + 1}화, 유료 대여 준비 중`
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
