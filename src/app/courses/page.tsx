import Link from 'next/link';

import { isAdmin as checkIsAdmin } from '@/lib/auth/access';
import { getTapeDisplay } from '@/lib/courses/course-display';
import {
  getPublicCoursePlayback,
  type PublicLessonMetadata,
} from '@/lib/courses/public-course-metadata';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

import { VideoShelfTheater, type ShelfTape } from './video-shelf-theater';

export const dynamic = 'force-dynamic';

type LessonRow = PublicLessonMetadata & {
  course_id: string;
};

export default async function CoursesPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="min-h-dvh bg-[#080607] px-5 py-8 text-[#fff7ed]">
        <section className="mx-auto max-w-4xl border border-[#60473c] bg-[#120d0b] p-6 text-sm leading-6 text-[#f1b37f]">
          Supabase 환경 변수를 설정하면 비디오 책장을 불러올 수 있어요.
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  const courseIds = (courses ?? []).map((course) => course.id);
  const { data: lessons, error: lessonsError } = courseIds.length
    ? await supabase
        .from('lessons')
        .select('id, course_id, duration_seconds, has_video')
        .in('course_id', courseIds)
    : { data: [], error: null };

  if (lessonsError) {
    throw new Error('Failed to load public video metadata.');
  }
  const { data: enrollments } =
    user && courseIds.length
      ? await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id)
          .in('course_id', courseIds)
      : { data: [] };

  const lessonsByCourseId = new Map<string, LessonRow[]>();
  for (const lesson of (lessons ?? []) as LessonRow[]) {
    const courseLessons = lessonsByCourseId.get(lesson.course_id) ?? [];
    courseLessons.push(lesson);
    lessonsByCourseId.set(lesson.course_id, courseLessons);
  }

  const enrolledCourseIds = new Set(
    (enrollments ?? []).map((enrollment) => enrollment.course_id),
  );
  const role = profile?.role === 'admin' ? 'admin' : 'user';
  const isAdmin = checkIsAdmin(role);
  const tapes: ShelfTape[] = (courses ?? []).map((course, index) => {
    const courseLessons = lessonsByCourseId.get(course.id) ?? [];
    const playback = getPublicCoursePlayback(courseLessons);

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      hasPlayableVideo: playback.hasPlayableVideo,
      display: getTapeDisplay({
        index,
        hasPlayableVideo: playback.hasPlayableVideo,
        isEnrolled: enrolledCourseIds.has(course.id),
        lessonCount: courseLessons.length,
        runtimeSeconds: playback.runtimeSeconds,
      }),
    };
  });

  return (
    <main className="min-h-dvh bg-[#080607] text-[#fff7ed]">
      <VideoShelfTheater
        tapes={tapes}
        userHref={user ? '/main' : '/'}
        userLabel={user ? '내 보관함' : '로그인'}
      />

      {isAdmin ? (
        <section className="border-t border-[#2a211d] bg-[#0f0b0a] px-5 py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em]">
                운영자 편집실
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c9b8aa]">
                기존 강의 등록 도구로 작품과 회차를 계속 관리할 수 있습니다.
              </p>
            </div>
            <Link
              className="inline-flex h-12 items-center border border-[#60473c] px-5 text-sm font-black text-[#fff7ed] transition hover:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff8ea3] focus:outline-none"
              href="/admin">
              관리자 화면
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
