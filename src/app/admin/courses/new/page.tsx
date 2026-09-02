import { ArrowLeft, Info, Save, UploadCloud } from 'lucide-react';
import Link from 'next/link';

import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { requireAdmin } from '@/lib/auth/server';

import styles from '../../admin-video-room.module.css';
import { createCourse } from '../actions';
import { ThumbnailUploader, VideoUploader } from '../thumbnail-uploader';

type NewCoursePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function NewCoursePage({
  searchParams,
}: NewCoursePageProps) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <VideoRoomShell activeItem="upload" mode="staff" showStaffCat={false}>
      <header className={styles.formHeader}>
        <Link href="/admin">
          <ArrowLeft aria-hidden="true" size={18} /> 인벤토리
        </Link>
        <div>
          <span>
            <UploadCloud aria-hidden="true" size={22} /> 새 비디오 등록
          </span>
          <h1>작품과 첫 회차를 준비해 주세요.</h1>
          <p>
            첫 회차는 지금 함께 올리거나, 작품을 만든 뒤 편집실에서 추가할 수
            있어요.
          </p>
        </div>
      </header>

      <main className={styles.registrationPage}>
        <form action={createCourse} className={styles.registrationForm}>
          {error ? (
            <p className={styles.formError}>작품 제목을 확인해 주세요.</p>
          ) : null}

          <div className={styles.registrationGrid}>
            <section className={styles.uploadColumn}>
              <ThumbnailUploader
                description="메인 선반과 상세 페이지에 보이는 작품 표지입니다."
                label="비디오 표지"
              />
              <VideoUploader
                description="선택 사항입니다. 비워두면 편집실에서 1화를 등록할 수 있어요."
                label="첫 회차 영상"
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
                <span>
                  첫 회차 제목 <small>선택</small>
                </span>
                <input
                  name="episodeTitle"
                  placeholder="비워두면 1화로 저장됩니다."
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
                <span>
                  첫 회차 설명 <small>선택</small>
                </span>
                <textarea
                  name="episodeContent"
                  placeholder="첫 회차에 대한 짧은 설명을 입력하세요."
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
                <strong>등록 후 편집실로 이동합니다.</strong> 나머지 회차는
                그곳에서 순서대로 계속 추가할 수 있어요.
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
