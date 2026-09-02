import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ListVideo,
} from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import styles from '@/app/video-room-pages.module.css';
import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { VhsTape } from '@/components/video-room/VideoRoomVisuals';
import { canViewLessonContent } from '@/lib/auth/access';
import { getUserProfile, requireUser } from '@/lib/auth/server';
import { getEpisodeNavigation } from '@/lib/courses/video-room-pages';

import { markLessonComplete } from '../../../actions';

type LessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const { supabase, user } = await requireUser();
  const profile = await getUserProfile(supabase, user.id);
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (
    !canViewLessonContent({
      role: profile.role,
      isEnrolled: Boolean(enrollment),
    })
  ) {
    redirect(`/courses/${courseId}`);
  }

  const [{ data: course }, { data: lessons }, { count: bagCount }] =
    await Promise.all([
      supabase
        .from('courses')
        .select('id, title, thumbnail_url')
        .eq('id', courseId)
        .maybeSingle(),
      supabase
        .from('lessons')
        .select('id, title, sort_order, thumbnail_url')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

  const lesson = lessons?.find((item) => item.id === lessonId);
  if (!course || !lesson) notFound();

  const [{ data: lessonContent }, { data: progress }] = await Promise.all([
    supabase
      .from('lesson_contents')
      .select('content, video_url')
      .eq('lesson_id', lesson.id)
      .maybeSingle(),
    supabase
      .from('lesson_progress')
      .select('completed_at')
      .eq('lesson_id', lesson.id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  const navigation = getEpisodeNavigation(lessons ?? [], lesson.id);

  return (
    <VideoRoomShell
      activeItem="history"
      bagCount={bagCount ?? 0}
      isAdmin={profile.role === 'admin'}
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
              {lessonContent?.video_url ? (
                <video
                  controls
                  poster={
                    lesson.thumbnail_url || course.thumbnail_url || undefined
                  }
                  src={lessonContent.video_url}
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
          {navigation.previousId ? (
            <Link
              href={`/courses/${courseId}/lessons/${navigation.previousId}`}>
              <ChevronLeft aria-hidden="true" size={18} /> 이전 회차
            </Link>
          ) : (
            <span />
          )}
          <form action={markLessonComplete.bind(null, courseId, lesson.id)}>
            <button disabled={Boolean(progress)} type="submit">
              <Check aria-hidden="true" size={17} />
              {progress ? '시청 완료됨' : '시청 완료'}
            </button>
          </form>
          {navigation.nextId ? (
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
          <ol>
            {(lessons ?? []).map((item) => (
              <li key={item.id}>
                <Link
                  aria-current={item.id === lesson.id ? 'page' : undefined}
                  href={`/courses/${courseId}/lessons/${item.id}`}>
                  <span>{String(item.sort_order).padStart(2, '0')}</span>
                  <strong>{item.title}</strong>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </VideoRoomShell>
  );
}
