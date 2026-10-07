'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/server';

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
