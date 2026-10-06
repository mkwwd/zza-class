'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/server';
import { parseCourseForm, parseLessonForm } from '@/lib/courses/course-form';
import type { CourseFormInput, LessonFormInput } from '@/lib/courses/types';

function getCourseEditPath(courseId: string, error?: string) {
  const path = `/admin/courses/${courseId}/edit`;
  return error ? `${path}?error=${error}` : path;
}

function getCourseValues(course: CourseFormInput) {
  return {
    description: course.description,
    preview_video_object_key: course.previewVideoObjectKey || null,
    staff_note: course.staffNote || null,
    status: course.status,
    thumbnail_image_id: course.thumbnailImageId || null,
    thumbnail_url: course.thumbnailUrl || null,
    title: course.title,
  };
}

function getLessonValues(lesson: LessonFormInput) {
  return {
    duration_seconds: lesson.durationSeconds,
    has_video: Boolean(lesson.videoObjectKey || lesson.videoUrl),
    sort_order: lesson.sortOrder,
    title: lesson.title,
  };
}

function revalidateCatalog() {
  revalidatePath('/admin');
  revalidatePath('/main');
}

function revalidateCourseEditor(courseId: string) {
  revalidatePath(getCourseEditPath(courseId));
  revalidatePath(`/courses/${courseId}`);
}

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
      ...getCourseValues(parsed.value),
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
    const { error: cleanupError } = await supabase
      .from('courses')
      .delete()
      .eq('id', data.id);

    if (cleanupError) {
      redirect('/admin/courses/new?error=course-cleanup-failed');
    }

    redirect('/admin/courses/new?error=invalid-course');
  }

  revalidateCatalog();
  redirect(getCourseEditPath(data.id));
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseCourseForm(formData);

  if (!parsed.ok) {
    redirect(getCourseEditPath(courseId, 'invalid-course'));
  }

  const { error: courseError } = await supabase
    .from('courses')
    .update({
      ...getCourseValues(parsed.value),
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId);

  if (courseError) {
    redirect(getCourseEditPath(courseId, 'invalid-course'));
  }

  const { error: genreError } = await supabase.rpc('replace_course_genres', {
    selected_genre_slugs: parsed.value.genreSlugs,
    target_course_id: courseId,
  });

  if (genreError) {
    redirect(getCourseEditPath(courseId, 'invalid-course'));
  }

  revalidateCatalog();
  revalidatePath(getCourseEditPath(courseId));
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
    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      ...getLessonValues(parsed.value),
    })
    .select('id')
    .single();

  if (lessonError || !lesson) {
    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  const { error: contentError } = await supabase
    .from('lesson_contents')
    .insert({
      content: parsed.value.content,
      lesson_id: lesson.id,
      video_object_key: parsed.value.videoObjectKey || null,
      video_url: parsed.value.videoUrl,
    });

  if (contentError) {
    const { error: cleanupError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lesson.id)
      .eq('course_id', courseId);

    if (cleanupError) {
      redirect(getCourseEditPath(courseId, 'lesson-cleanup-failed'));
    }

    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  revalidateCourseEditor(courseId);
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  formData: FormData,
) {
  const { supabase } = await requireAdmin();
  const parsed = parseLessonForm(formData);

  if (!parsed.ok) {
    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  const { data: previousLesson, error: previousLessonError } = await supabase
    .from('lessons')
    .select('title, sort_order, duration_seconds, has_video, updated_at')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (previousLessonError || !previousLesson) {
    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  const { error: lessonError } = await supabase
    .from('lessons')
    .update({
      ...getLessonValues(parsed.value),
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .eq('course_id', courseId);

  if (lessonError) {
    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  const { error: contentError } = await supabase.from('lesson_contents').upsert(
    {
      content: parsed.value.content,
      lesson_id: lessonId,
      updated_at: new Date().toISOString(),
      video_object_key: parsed.value.videoObjectKey || null,
      video_url: parsed.value.videoUrl,
    },
    { onConflict: 'lesson_id' },
  );

  if (contentError) {
    const { error: rollbackError } = await supabase
      .from('lessons')
      .update(previousLesson)
      .eq('id', lessonId)
      .eq('course_id', courseId);

    if (rollbackError) {
      redirect(getCourseEditPath(courseId, 'lesson-cleanup-failed'));
    }

    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}

export async function deleteLesson(courseId: string, lessonId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('course_id', courseId);

  if (error) {
    redirect(getCourseEditPath(courseId, 'invalid-lesson'));
  }

  revalidateCourseEditor(courseId);
}
