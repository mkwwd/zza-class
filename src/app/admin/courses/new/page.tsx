import { ArrowLeft, Info, Save, UploadCloud } from 'lucide-react';
import Link from 'next/link';

import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { requireAdmin } from '@/lib/auth/server';
import type { GenreOption, GenreSlug } from '@/lib/courses/genres';

import styles from '../../admin-video-room.module.css';
import { createCourse } from '../actions';
import { GenreSelector } from '../genre-selector';
import { ThumbnailUploader } from '../thumbnail-uploader';

type NewCoursePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function NewCoursePage({
  searchParams,
}: NewCoursePageProps) {
  const { supabase } = await requireAdmin();
  const { error } = await searchParams;
  const { data: genres, error: genreCatalogError } = await supabase
    .from('genres')
    .select('slug, label_ko, label_en, sort_order')
    .order('sort_order', { ascending: true });

  if (genreCatalogError) {
    throw new Error('Failed to load genre catalog.');
  }

  const genreOptions: GenreOption[] = (genres ?? []).map((genre) => ({
    labelEn: genre.label_en,
    labelKo: genre.label_ko,
    slug: genre.slug as GenreSlug,
  }));

  return (
    <VideoRoomShell activeItem="upload" mode="staff">
      <header className={styles.formHeader}>
        <Link href="/admin">
          <ArrowLeft aria-hidden="true" size={18} /> 인벤토리
        </Link>
        <div>
          <span>
            <UploadCloud aria-hidden="true" size={22} /> 새 비디오 등록
          </span>
          <h1>작품 정보를 먼저 준비해 주세요.</h1>
          <p>비디오의 기본 틀을 만든 뒤 편집실에서 회차를 추가할 수 있어요.</p>
        </div>
      </header>

      <main className={styles.registrationPage}>
        <form action={createCourse} className={styles.registrationForm}>
          {error ? (
            <p className={styles.formError}>
              {error === 'course-cleanup-failed'
                ? '작품 저장 실패 후 임시 데이터를 정리하지 못했어요. 인벤토리에서 중복 작품을 확인해 주세요.'
                : '작품 입력 내용을 확인해 주세요.'}
            </p>
          ) : null}

          <div className={styles.registrationGrid}>
            <section className={styles.uploadColumn}>
              <ThumbnailUploader
                description="메인 선반과 상세 페이지에 보이는 작품 표지입니다."
                label="비디오 표지"
              />
            </section>

            <section className={styles.fieldsColumn}>
              <label>
                <span>
                  작품 제목 <strong>필수</strong>
                </span>
                <input
                  maxLength={100}
                  name="title"
                  placeholder="비디오 제목을 입력하세요."
                  required
                />
              </label>
              <label>
                <span>작품 설명</span>
                <textarea
                  maxLength={500}
                  name="description"
                  placeholder="작품의 분위기와 줄거리를 소개해 주세요."
                />
              </label>
              <GenreSelector options={genreOptions} />
              <label>
                <span>
                  Staff 리코의 한마디 <small>선택</small>
                </span>
                <textarea
                  maxLength={180}
                  name="staffNote"
                  placeholder="이 작품을 고른 손님에게 건넬 짧은 멘트를 입력하세요."
                />
              </label>
              <label>
                <span>공개 상태</span>
                <select defaultValue="draft" name="status">
                  <option value="draft">비공개 · 편집 중</option>
                  <option value="published">공개 · 선반에 진열</option>
                </select>
              </label>
            </section>
          </div>

          <footer className={styles.formFooter}>
            <div className={styles.formNotice}>
              <Info aria-hidden="true" size={19} />
              <p>
                <strong>등록 후 회차를 추가할 수 있어요.</strong> 작품을
                저장하면 편집실로 이동해 1화부터 순서대로 등록합니다.
              </p>
            </div>
            <Link href="/admin">취소</Link>
            <button type="submit">
              <Save aria-hidden="true" size={18} /> 등록하기
            </button>
          </footer>
        </form>
      </main>
    </VideoRoomShell>
  );
}
