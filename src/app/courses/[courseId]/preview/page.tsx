import { ArrowLeft, ListVideo } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import styles from '@/app/video-room-pages.module.css';
import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { VhsTape } from '@/components/video-room/VideoRoomVisuals';
import { getUserProfile } from '@/lib/auth/server';
import { getCourseThumbnailSrc } from '@/lib/courses/course-thumbnail';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { buildPreviewPlaybackPath } from '@/lib/videos/playback-proxy';

type PreviewPageProps = {
  params: Promise<{ courseId: string }>;
};

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: PreviewPageProps) {
  if (!hasSupabaseEnv()) redirect('/');

  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUserProfile(supabase, user.id) : null;
  const [{ data: course }, { count: bagCount }] = await Promise.all([
    supabase
      .from('courses')
      .select(
        'id, title, thumbnail_image_id, thumbnail_url, preview_video_object_key',
      )
      .eq('id', courseId)
      .maybeSingle(),
    user
      ? supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      : Promise.resolve({ count: 0 }),
  ]);

  if (!course) notFound();

  if (!course.preview_video_object_key) {
    const { data: firstLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', course.id)
      .eq('sort_order', 1)
      .eq('has_video', true)
      .maybeSingle();

    if (firstLesson) {
      redirect(`/courses/${course.id}/lessons/${firstLesson.id}`);
    }
  }

  const previewUrl = course.preview_video_object_key
    ? buildPreviewPlaybackPath(course.id)
    : null;

  return (
    <VideoRoomShell
      activeItem="catalog"
      bagCount={bagCount ?? 0}
      isAdmin={profile?.role === 'admin'}
      showStaffCat={false}>
      <header className={styles.utilityBar}>
        <Link className={styles.backLink} href={`/courses/${course.id}`}>
          <ArrowLeft aria-hidden="true" size={18} />
          작품 상세
        </Link>
        <Link className={styles.bagAction} href={user ? '/my-page' : '/'}>
          <ListVideo aria-hidden="true" size={18} />
          MY BAG ({bagCount ?? 0})
        </Link>
      </header>

      <main className={styles.playerPage}>
        <div className={styles.playerHeading}>
          <div>
            <span>{course.title}</span>
            <h1>미리보기</h1>
          </div>
        </div>

        <section className={styles.crtTelevision} aria-label="미리보기 재생기">
          <div className={styles.crtBody}>
            <div className={styles.crtScreen}>
              {previewUrl ? (
                <video
                  controls
                  poster={getCourseThumbnailSrc(course) || undefined}
                  src={previewUrl}
                />
              ) : (
                <div className={styles.playerEmpty}>
                  <VhsTape code="VR-PREVIEW" label="준비중" />
                  <p>미리보기 영상이 아직 준비되지 않았어요.</p>
                </div>
              )}
              <span className={styles.scanlines} aria-hidden="true" />
              <span className={styles.playIndicator}>PLAY · PREVIEW</span>
            </div>
            <div className={styles.crtPanel}>
              <div>
                <small>NOW PREVIEWING</small>
                <strong>{course.title}</strong>
              </div>
              <span>VIDEO ROOM</span>
            </div>
          </div>
        </section>
      </main>
    </VideoRoomShell>
  );
}
