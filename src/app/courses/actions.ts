'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/server';

export async function enrollInCourse(courseId: string) {
  const { supabase, user } = await requireUser();

  await supabase.from('enrollments').upsert(
    {
      course_id: courseId,
      user_id: user.id,
    },
    {
      ignoreDuplicates: true,
      onConflict: 'user_id,course_id',
    },
  );

  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function markLessonComplete(courseId: string, lessonId: string) {
  const { supabase, user } = await requireUser();

  await supabase.from('lesson_progress').upsert(
    {
      completed_at: new Date().toISOString(),
      lesson_id: lessonId,
      user_id: user.id,
    },
    { onConflict: 'user_id,lesson_id' },
  );

  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}
