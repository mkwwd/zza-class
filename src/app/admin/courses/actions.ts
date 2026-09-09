'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/server';
import { parseCourseForm, parseLessonForm } from '@/lib/courses/course-form';

export async function createCourse(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = parseCourseForm(formData);

  if (!parsed.ok) {
    redirect('/admin/courses/new?error=invalid-course');
  }

  const { data, error: courseError } = await supabase
    .from('courses')
    .insert({
      created_by: user.id,
      description: parsed.value.description,
      staff_note: parsed.value.staffNote || null,
      status: parsed.value.status,
      thumbnail_image_id: parsed.value.thumbnailImageId || null,
      thumbnail_url: parsed.value.thumbnailUrl || null,
      title: parsed.value.title,
    })
    .select('id')
    .single();

  if (courseError || !data) {
    redirect('/admin/courses/new?error=invalid-course');
  }

  const { error: genreError } = await supabase.rpc('replace_course_genres', {
    selected_genre_slugs: parsed.value.genreSlugs,
    target_course_id: data.id,
  });

  if (genreError) {
    await supabase.from('courses').delete().eq('id', data.id);
    redirect('/admin/courses/new?error=invalid-course');
  }

  revalidatePath('/admin');
  revalidatePath('/main');
  redirect(`/admin/courses/${data.id}/edit`);
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseCourseForm(formData);

  if (!parsed.ok) {
    redirect(`/admin/courses/${courseId}/edit?error=invalid-course`);
  }

  const { error: courseError } = await supabase
    .from('courses')
    .update({
      description: parsed.value.description,
      staff_note: parsed.value.staffNote || null,
      status: parsed.value.status,
      thumbnail_image_id: parsed.value.thumbnailImageId || null,
      thumbnail_url: parsed.value.thumbnailUrl || null,
      title: parsed.value.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId);

  if (courseError) {
    redirect(`/admin/courses/${courseId}/edit?error=invalid-course`);
  }

  const { error: genreError } = await supabase.rpc('replace_course_genres', {
    selected_genre_slugs: parsed.value.genreSlugs,
    target_course_id: courseId,
  });

  if (genreError) {
    redirect(`/admin/courses/${courseId}/edit?error=invalid-course`);
  }

  revalidatePath('/admin');
  revalidatePath('/main');
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

export async function deleteCourse(courseId: string) {
  const { supabase } = await requireAdmin();

  await supabase.from('courses').delete().eq('id', courseId);

  revalidatePath('/admin');
  redirect('/admin');
}

export async function addLesson(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseLessonForm(formData);

  if (!parsed.ok) {
    redirect(`/admin/courses/${courseId}/edit?error=invalid-lesson`);
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      duration_seconds: parsed.value.durationSeconds,
      has_video: Boolean(parsed.value.videoUrl),
      sort_order: parsed.value.sortOrder,
      title: parsed.value.title,
    })
    .select('id')
    .single();

  if (lesson) {
    await supabase.from('lesson_contents').insert({
      content: parsed.value.content,
      lesson_id: lesson.id,
      video_url: parsed.value.videoUrl,
    });
  }

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  formData: FormData,
) {
  const { supabase } = await requireAdmin();
  const parsed = parseLessonForm(formData);

  if (!parsed.ok) {
    redirect(`/admin/courses/${courseId}/edit?error=invalid-lesson`);
  }

  await supabase
    .from('lessons')
    .update({
      duration_seconds: parsed.value.durationSeconds,
      has_video: Boolean(parsed.value.videoUrl),
      sort_order: parsed.value.sortOrder,
      title: parsed.value.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .eq('course_id', courseId);

  await supabase.from('lesson_contents').upsert(
    {
      content: parsed.value.content,
      lesson_id: lessonId,
      updated_at: new Date().toISOString(),
      video_url: parsed.value.videoUrl,
    },
    { onConflict: 'lesson_id' },
  );

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}

export async function deleteLesson(courseId: string, lessonId: string) {
  const { supabase } = await requireAdmin();

  await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('course_id', courseId);

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
}
