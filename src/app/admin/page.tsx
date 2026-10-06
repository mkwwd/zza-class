import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

import { VideoRoomShell } from '@/components/video-room/VideoRoomShell';
import { VhsTape } from '@/components/video-room/VideoRoomVisuals';
import { requireAdmin } from '@/lib/auth/server';
import { countBy } from '@/lib/collections';
import { formatCourseStatus } from '@/lib/courses/course-display';

import styles from './admin-video-room.module.css';
import { deleteCourse } from './courses/actions';

type AdminPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { supabase } = await requireAdmin();
  const { q, status } = await searchParams;
  const query = q?.trim().toLowerCase() ?? '';
  const activeStatus =
    status === 'published' || status === 'draft' ? status : 'all';

  const [{ data: courses }, { data: enrollments }, { data: lessons }] =
    await Promise.all([
      supabase
        .from('courses')
        .select('id, title, description, status, thumbnail_url, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('enrollments').select('course_id'),
      supabase.from('lessons').select('course_id'),
    ]);

  const enrollmentCounts = countBy(
    enrollments ?? [],
    (enrollment) => enrollment.course_id,
  );
  const lessonCounts = countBy(lessons ?? [], (lesson) => lesson.course_id);

  const allCourses = courses ?? [];
  const visibleCourses = allCourses.filter(
    (course) =>
      (activeStatus === 'all' || course.status === activeStatus) &&
      (!query ||
        course.title.toLowerCase().includes(query) ||
        (course.description ?? '').toLowerCase().includes(query)),
  );
  const publishedCount = allCourses.filter(
    (course) => course.status === 'published',
  ).length;
  const draftCount = allCourses.length - publishedCount;

  return (
    <VideoRoomShell activeItem="inventory" mode="staff">
      <header className={styles.adminHeader}>
        <div>
          <span>관리자 페이지 / STAFF ONLY</span>
          <h1>VIDEO INVENTORY</h1>
          <p>비디오 인벤토리 관리</p>
        </div>
        <Link className={styles.newVideoButton} href="/admin/courses/new">
          <Plus aria-hidden="true" size={18} /> 새 비디오 등록
        </Link>
      </header>

      <main className={styles.inventoryPage}>
        <section className={styles.inventoryToolbar}>
          <nav aria-label="비디오 상태 필터" className={styles.statusTabs}>
            <StatusLink
              count={allCourses.length}
              current={activeStatus}
              href="/admin"
              label="전체"
              value="all"
            />
            <StatusLink
              count={publishedCount}
              current={activeStatus}
              href="/admin?status=published"
              label="공개"
              value="published"
            />
            <StatusLink
              count={draftCount}
              current={activeStatus}
              href="/admin?status=draft"
              label="비공개"
              value="draft"
            />
          </nav>
          <form action="/admin" className={styles.inventorySearch}>
            {activeStatus !== 'all' ? (
              <input name="status" type="hidden" value={activeStatus} />
            ) : null}
            <Search aria-hidden="true" size={18} />
            <label className={styles.srOnly} htmlFor="inventory-search">
              비디오 검색
            </label>
            <input
              defaultValue={q}
              id="inventory-search"
              name="q"
              placeholder="제목 또는 설명 검색"
              type="search"
            />
            <button type="submit">
              <SlidersHorizontal aria-hidden="true" size={17} /> 필터
            </button>
          </form>
        </section>

        {visibleCourses.length ? (
          <div className={styles.tableViewport}>
            <table className={styles.inventoryTable}>
              <thead>
                <tr>
                  <th>비디오</th>
                  <th>회차</th>
                  <th>대여</th>
                  <th>공개 상태</th>
                  <th>등록일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {visibleCourses.map((course, index) => (
                  <tr key={course.id}>
                    <td>
                      <div className={styles.titleCell}>
                        <div className={styles.inventoryThumb}>
                          {course.thumbnail_url ? (
                            <span
                              aria-label={`${course.title} 썸네일`}
                              role="img"
                              style={{
                                backgroundImage: `url(${course.thumbnail_url})`,
                              }}
                            />
                          ) : (
                            <VhsTape
                              code={`VR-${String(index + 1).padStart(3, '0')}`}
                              label="준비중"
                            />
                          )}
                        </div>
                        <div>
                          <strong>{course.title}</strong>
                          <small>
                            {course.description || '작품 설명 없음'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{lessonCounts.get(course.id) ?? 0}화</td>
                    <td>{enrollmentCounts.get(course.id) ?? 0}명</td>
                    <td>
                      <span
                        className={
                          course.status === 'published'
                            ? styles.published
                            : styles.draft
                        }>
                        {formatCourseStatus(course.status)}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Intl.DateTimeFormat('ko-KR', {
                        dateStyle: 'medium',
                      }).format(new Date(course.created_at))}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link
                          aria-label={`${course.title} 수정`}
                          href={`/admin/courses/${course.id}/edit`}>
                          <Pencil aria-hidden="true" size={16} /> 수정
                        </Link>
                        <form action={deleteCourse.bind(null, course.id)}>
                          <button
                            aria-label={`${course.title} 삭제`}
                            type="submit">
                            <Trash2 aria-hidden="true" size={16} />
                          </button>
                        </form>
                        <button
                          aria-label={`${course.title} 추가 메뉴`}
                          type="button">
                          <MoreHorizontal aria-hidden="true" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.inventoryEmpty}>
            <VhsTape code="VR-EMPTY" label="준비중" />
            <div>
              <h2>조건에 맞는 비디오가 없어요.</h2>
              <p>검색어를 지우거나 새로운 비디오를 등록해 주세요.</p>
            </div>
          </div>
        )}
      </main>
    </VideoRoomShell>
  );
}

function StatusLink({
  count,
  current,
  href,
  label,
  value,
}: {
  count: number;
  current: string;
  href: string;
  label: string;
  value: string;
}) {
  return (
    <Link aria-current={current === value ? 'page' : undefined} href={href}>
      {label} <span>{count}</span>
    </Link>
  );
}
