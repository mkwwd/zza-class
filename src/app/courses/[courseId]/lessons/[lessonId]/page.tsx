import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListVideo,
} from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import styles from '@/app/video-room-pages.module.css';
import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { VhsTape } from '@/components/video-room/VideoRoomVisuals';
import { canViewLessonContent } from '@/lib/auth/access';
import { getUserProfile } from '@/lib/auth/server';
import { getEpisodeNavigation } from '@/lib/courses/video-room-pages';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { buildLessonPlaybackPath } from '@/lib/videos/playback-proxy';

import { markLessonComplete } from '../../../actions';

type LessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: LessonPageProps) {
  if (!hasSupabaseEnv()) redirect('/');

  const { courseId, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUserProfile(supabase, user.id) : null;

  const [{ data: course }, { data: lessons }, { count: bagCount }] =
    await Promise.all([
      supabase
        .from('courses')
        .select('id, title, thumbnail_url')
        .eq('id', courseId)
        .maybeSingle(),
      supabase
        .from('lessons')
        .select('id, title, sort_order, thumbnail_url, has_video')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true }),
      user
        ? supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
        : Promise.resolve({ count: 0 }),
    ]);

  const lesson = lessons?.find((item) => item.id === lessonId);
  if (!course || !lesson) notFound();

  const { data: rental } = user
    ? await supabase
        .from('lesson_rentals')
        .select('id')
        .eq('lesson_id', lesson.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  if (
    !canViewLessonContent({
      isRented: Boolean(rental),
      role: profile?.role,
      sortOrder: lesson.sort_order,
    })
  ) {
    redirect(`/courses/${courseId}`);
  }

  const lessonIds = (lessons ?? []).map((item) => item.id);
  const [{ data: lessonContent }, { data: progress }, { data: rentals }] =
    await Promise.all([
      supabase
        .from('lesson_contents')
        .select('content')
        .eq('lesson_id', lesson.id)
        .maybeSingle(),
      user
        ? supabase
            .from('lesson_progress')
            .select('completed_at')
            .eq('lesson_id', lesson.id)
            .eq('user_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user && lessonIds.length
        ? supabase
            .from('lesson_rentals')
            .select('lesson_id')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds)
        : Promise.resolve({ data: [] }),
    ]);
  const rentedLessonIds = new Set(
    (rentals ?? []).map((item) => item.lesson_id),
  );
  const videoSource = lesson.has_video
    ? buildLessonPlaybackPath(lesson.id)
    : null;
  const navigation = getEpisodeNavigation(lessons ?? [], lesson.id);
  const canOpenLesson = (targetId: string | null) => {
    const target = lessons?.find((item) => item.id === targetId);

    return Boolean(
      target?.has_video &&
      canViewLessonContent({
        isRented: rentedLessonIds.has(target.id),
        role: profile?.role,
        sortOrder: target.sort_order,
      }),
    );
  };

  return (
    <VideoRoomShell
      activeItem="history"
      bagCount={bagCount ?? 0}
      isAdmin={profile?.role === 'admin'}
      showStaffCat={false}>
      <header className={styles.utilityBar}>
        <Link className={styles.backLink} href={`/courses/${courseId}`}>
          <ArrowLeft aria-hidden="true" size={18} />
          작품 상세
        </Link>
        <Link className={styles.bagAction} href="/my-page">
          <ListVideo aria-hidden="true" size={18} />
          MY BAG ({bagCount ?? 0})
        </Link>
      </header>

      <main className={styles.playerPage}>
        <div className={styles.playerHeading}>
          <div>
            <span>{course.title}</span>
            <h1>{lesson.title}</h1>
          </div>
          {progress ? (
            <strong>
              <Check aria-hidden="true" size={16} /> 시청 완료
            </strong>
          ) : null}
        </div>

        <section className={styles.crtTelevision} aria-label="비디오 재생기">
          <div className={styles.crtBody}>
            <div className={styles.crtScreen}>
              {videoSource ? (
                <video
                  controls
                  poster={
                    lesson.thumbnail_url || course.thumbnail_url || undefined
                  }
                  src={videoSource}
                />
              ) : (
                <div className={styles.playerEmpty}>
                  <VhsTape
                    code={`EP-${String(lesson.sort_order).padStart(2, '0')}`}
                    label="준비중"
                  />
                  <p>이 회차의 영상이 아직 준비되지 않았어요.</p>
                </div>
              )}
              <span className={styles.scanlines} aria-hidden="true" />
              <span className={styles.playIndicator}>
                PLAY · EP {String(lesson.sort_order).padStart(2, '0')}
              </span>
            </div>
            <div className={styles.crtPanel}>
              <div>
                <small>NOW PLAYING</small>
                <strong>{lesson.title}</strong>
              </div>
              <span>VIDEO ROOM</span>
            </div>
          </div>
        </section>

        <div className={styles.playerControlsRow}>
          {canOpenLesson(navigation.previousId) ? (
            <Link
              href={`/courses/${courseId}/lessons/${navigation.previousId}`}>
              <ChevronLeft aria-hidden="true" size={18} /> 이전 회차
            </Link>
          ) : (
            <span />
          )}
          {user ? (
            <form action={markLessonComplete.bind(null, courseId, lesson.id)}>
              <button disabled={Boolean(progress)} type="submit">
                <Check aria-hidden="true" size={17} />
                {progress ? '시청 완료됨' : '시청 완료'}
              </button>
            </form>
          ) : (
            <Link href="/">로그인</Link>
          )}
          {canOpenLesson(navigation.nextId) ? (
            <Link href={`/courses/${courseId}/lessons/${navigation.nextId}`}>
              다음 회차 <ChevronRight aria-hidden="true" size={18} />
            </Link>
          ) : (
            <span />
          )}
        </div>

        <section className={styles.playerNotes}>
          <div>
            <h2>이번 회차 이야기</h2>
            <p>
              {lessonContent?.content || '아직 회차 설명이 준비되지 않았어요.'}
            </p>
          </div>
          <ol className={styles.playerEpisodes}>
            {(lessons ?? []).map((item) => {
              const episodeCode = `EPISODE ${String(item.sort_order).padStart(2, '0')}`;

              return (
                <li key={item.id}>
                  {canOpenLesson(item.id) ? (
                    <Link
                      aria-current={item.id === lesson.id ? 'page' : undefined}
                      href={`/courses/${courseId}/lessons/${item.id}`}>
                      <div className={styles.episodeVisual}>
                        <VhsTape
                          code={episodeCode}
                          label={`${item.sort_order}회`}
                          orientation="horizontal"
                        />
                      </div>
                      <div className={styles.episodeCopy}>
                        <span>{episodeCode}</span>
                        <h3>{item.title}</h3>
                        <small>
                          <Clock3 aria-hidden="true" size={14} /> SHORT VIDEO
                        </small>
                      </div>
                    </Link>
                  ) : (
                    <div aria-label={`${item.sort_order}화, 유료 대여 준비 중`}>
                      <div className={styles.episodeVisual}>
                        <VhsTape
                          code={episodeCode}
                          label={`${item.sort_order}회`}
                          orientation="horizontal"
                        />
                      </div>
                      <div className={styles.episodeCopy}>
                        <span>{episodeCode}</span>
                        <h3>{item.title}</h3>
                        <small>
                          <Clock3 aria-hidden="true" size={14} /> 유료 대여 준비
                          중
                        </small>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </VideoRoomShell>
  );
}
