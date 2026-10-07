import { ArrowLeft, Eye, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { requireAdmin } from '@/lib/auth/server';
import { getCourseThumbnailSrc } from '@/lib/courses/course-thumbnail';
import type { GenreOption, GenreSlug } from '@/lib/courses/genres';
import { formatLessonNumber } from '@/lib/courses/lesson-display';

import styles from '../../../admin-video-room.module.css';
import {
  addLesson,
  deleteLesson,
  updateCourse,
  updateLesson,
} from '../../actions';
import { GenreSelector } from '../../genre-selector';
import { ThumbnailUploader, VideoUploader } from '../../thumbnail-uploader';

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function EditCoursePage({
  params,
  searchParams,
}: EditCoursePageProps) {
  const { courseId } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: course } = await supabase
    .from('courses')
    .select(
      'id, title, description, staff_note, status, thumbnail_image_id, thumbnail_url, preview_video_object_key',
    )
    .eq('id', courseId)
    .maybeSingle();

  if (!course) notFound();

  const { data: genres, error: genreCatalogError } = await supabase
    .from('genres')
    .select('slug, label_ko, label_en, sort_order')
    .order('sort_order', { ascending: true });
  const { data: courseGenres, error: courseGenresError } = await supabase
    .from('course_genres')
    .select('genre_slug, position')
    .eq('course_id', course.id)
    .order('position', { ascending: true });

  if (genreCatalogError || courseGenresError) {
    throw new Error('Failed to load course genres.');
  }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order, duration_seconds')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });
  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const { data: lessonContents } = lessonIds.length
    ? await supabase
        .from('lesson_contents')
        .select('lesson_id, content, video_object_key, video_url')
        .in('lesson_id', lessonIds)
    : { data: [] };
  const contentByLessonId = new Map(
    (lessonContents ?? []).map((content) => [content.lesson_id, content]),
  );
  const genreOptions: GenreOption[] = (genres ?? []).map((genre) => ({
    labelEn: genre.label_en,
    labelKo: genre.label_ko,
    slug: genre.slug as GenreSlug,
  }));
  const selectedGenres = (courseGenres ?? []).map(
    (courseGenre) => courseGenre.genre_slug as GenreSlug,
  );

  return (
    <VideoRoomShell activeItem="inventory" mode="staff">
      <header className={styles.editorHeader}>
        <div>
          <Link href="/admin">
            <ArrowLeft aria-hidden="true" size={18} /> 인벤토리
          </Link>
          <h1>{course.title}</h1>
          <p>작품 정보와 회차를 한곳에서 관리합니다.</p>
        </div>
        <Link href={`/courses/${course.id}`}>
          <Eye aria-hidden="true" size={18} /> 작품 보기
        </Link>
      </header>

      <main className={styles.editorPage}>
        {error ? (
          <p className={styles.formError}>
            {error === 'lesson-cleanup-failed'
              ? '회차 저장 실패 후 데이터를 되돌리지 못했어요. 다시 저장하기 전에 현재 회차를 확인해 주세요.'
              : '입력 내용을 다시 확인해 주세요.'}
          </p>
        ) : null}

        <section className={styles.editorBand}>
          <div className={styles.editorSectionHeading}>
            <div>
              <h2>작품 정보</h2>
              <p>비디오 케이스와 공개 상태를 수정합니다.</p>
            </div>
          </div>
          <form
            action={updateCourse.bind(null, course.id)}
            className={styles.courseEditorForm}>
            <div className={styles.uploadColumn}>
              <ThumbnailUploader
                description="메인 선반과 상세 화면의 대표 이미지입니다."
                initialImageId={course.thumbnail_image_id}
                initialImageUrl={course.thumbnail_url}
                initialPreviewUrl={getCourseThumbnailSrc(course)}
                label="비디오 표지"
              />
              <VideoUploader
                description="등록하면 1화 대신 작품 미리보기에 사용합니다."
                durationName={null}
                initialVideoObjectKey={course.preview_video_object_key}
                label="별도 미리보기 영상"
                objectKeyName="previewVideoObjectKey"
                uploadKind="preview"
                urlName={null}
              />
            </div>
            <div className={styles.editorFields}>
              <label>
                <span>작품 제목</span>
                <input defaultValue={course.title} name="title" required />
              </label>
              <label>
                <span>작품 설명</span>
                <textarea
                  defaultValue={course.description ?? ''}
                  name="description"
                />
              </label>
              <GenreSelector
                initialSelected={selectedGenres}
                options={genreOptions}
              />
              <label>
                <span>Staff 리코의 한마디</span>
                <textarea
                  defaultValue={course.staff_note ?? ''}
                  maxLength={180}
                  name="staffNote"
                  placeholder="작품을 추천하는 짧은 멘트를 입력하세요."
                />
              </label>
              <label>
                <span>공개 상태</span>
                <select defaultValue={course.status} name="status">
                  <option value="draft">비공개</option>
                  <option value="published">공개</option>
                </select>
              </label>
              <button type="submit">
                <Save aria-hidden="true" size={17} /> 작품 정보 저장
              </button>
            </div>
          </form>
        </section>

        <section className={styles.editorBand}>
          <div className={styles.editorSectionHeading}>
            <div>
              <h2>회차 편집실</h2>
              <p>작품에 담길 이야기를 1화부터 순서대로 추가할 수 있어요.</p>
            </div>
            <span>{lessons?.length ?? 0} EPISODES</span>
          </div>

          <details className={styles.newEpisodePanel} open={!lessons?.length}>
            <summary>
              <Plus aria-hidden="true" size={18} /> 새 회차 추가
            </summary>
            <form action={addLesson.bind(null, course.id)}>
              <div className={styles.episodeFieldRow}>
                <label>
                  <span>회차 제목</span>
                  <input
                    name="title"
                    placeholder="예: 다시 켜진 불빛"
                    required
                  />
                </label>
                <label>
                  <span>순서</span>
                  <input
                    defaultValue={(lessons?.length ?? 0) + 1}
                    min={1}
                    name="sortOrder"
                    type="number"
                  />
                </label>
              </div>
              <div className={styles.episodeMediaGrid}>
                <VideoUploader
                  description="MP4 또는 WebM 영상을 업로드합니다."
                  label="회차 영상"
                />
              </div>
              <label className={styles.fullField}>
                <span>회차 설명</span>
                <textarea
                  name="content"
                  placeholder="이번 회차의 내용을 소개해 주세요."
                />
              </label>
              <button className={styles.addEpisodeButton} type="submit">
                <Plus aria-hidden="true" size={17} /> 회차 추가
              </button>
            </form>
          </details>

          {lessons?.length ? (
            <ol className={styles.episodeEditorList}>
              {lessons.map((lesson, index) => {
                const content = contentByLessonId.get(lesson.id);
                return (
                  <li key={lesson.id}>
                    <details>
                      <summary>
                        <span>
                          {String(lesson.sort_order).padStart(2, '0')}
                        </span>
                        <div>
                          <strong>{lesson.title}</strong>
                          <small>
                            {content?.video_object_key || content?.video_url
                              ? '영상 연결됨'
                              : '영상 준비중'}
                          </small>
                        </div>
                        <em>{formatLessonNumber(index)}</em>
                      </summary>
                      <form
                        action={updateLesson.bind(null, course.id, lesson.id)}
                        className={styles.episodeEditForm}
                        id={`update-lesson-${lesson.id}`}>
                        <div className={styles.episodeFieldRow}>
                          <label>
                            <span>회차 제목</span>
                            <input
                              defaultValue={lesson.title}
                              name="title"
                              required
                            />
                          </label>
                          <label>
                            <span>순서</span>
                            <input
                              defaultValue={lesson.sort_order}
                              min={1}
                              name="sortOrder"
                              type="number"
                            />
                          </label>
                        </div>
                        <div className={styles.episodeMediaGrid}>
                          <VideoUploader
                            description="등록된 영상을 교체할 수 있습니다."
                            initialDurationSeconds={lesson.duration_seconds}
                            initialVideoObjectKey={content?.video_object_key}
                            initialVideoUrl={content?.video_url}
                            label="회차 영상"
                          />
                        </div>
                        <label className={styles.fullField}>
                          <span>회차 설명</span>
                          <textarea
                            defaultValue={content?.content ?? ''}
                            name="content"
                          />
                        </label>
                      </form>
                      <div className={styles.episodeEditActions}>
                        <button
                          form={`update-lesson-${lesson.id}`}
                          type="submit">
                          <Save aria-hidden="true" size={16} /> 회차 저장
                        </button>
                        <form
                          action={deleteLesson.bind(
                            null,
                            course.id,
                            lesson.id,
                          )}>
                          <button type="submit">
                            <Trash2 aria-hidden="true" size={16} /> 삭제
                          </button>
                        </form>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className={styles.noEpisodes}>
              아직 등록된 회차가 없어요. 위에서 첫 회차를 추가해 주세요.
            </p>
          )}
        </section>
      </main>
    </VideoRoomShell>
  );
}
