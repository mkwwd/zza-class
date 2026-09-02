import { ArrowLeft, Eye, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { requireAdmin } from '@/lib/auth/server';
import { formatLessonNumber } from '@/lib/courses/lesson-display';

import styles from '../../../admin-video-room.module.css';
import {
  addLesson,
  deleteLesson,
  updateCourse,
  updateLesson,
} from '../../actions';
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
    .select('id, title, description, status, thumbnail_url, thumbnail_image_id')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order, thumbnail_url, thumbnail_image_id')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });
  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const { data: lessonContents } = lessonIds.length
    ? await supabase
        .from('lesson_contents')
        .select('lesson_id, content, video_url')
        .in('lesson_id', lessonIds)
    : { data: [] };
  const contentByLessonId = new Map(
    (lessonContents ?? []).map((content) => [content.lesson_id, content]),
  );

  return (
    <VideoRoomShell activeItem="inventory" mode="staff" showStaffCat={false}>
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
          <p className={styles.formError}>입력 내용을 다시 확인해 주세요.</p>
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
            <ThumbnailUploader
              description="메인 선반과 상세 화면의 대표 이미지입니다."
              initialImageId={course.thumbnail_image_id}
              initialImageUrl={course.thumbnail_url}
              label="비디오 표지"
            />
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
              <p>2화, 3화와 이후 회차를 계속 추가할 수 있어요.</p>
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
                <ThumbnailUploader
                  description="회차 목록에 보이는 이미지입니다."
                  label="회차 썸네일"
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
                            {content?.video_url ? '영상 연결됨' : '영상 준비중'}
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
                            initialVideoUrl={content?.video_url}
                            label="회차 영상"
                          />
                          <ThumbnailUploader
                            description="회차 목록의 대표 이미지입니다."
                            initialImageId={lesson.thumbnail_image_id}
                            initialImageUrl={lesson.thumbnail_url}
                            label="회차 썸네일"
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
