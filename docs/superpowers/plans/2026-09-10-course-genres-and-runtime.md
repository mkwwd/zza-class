# Course Genres and Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generated genre and runtime labels with up to two relational course genres and the exact summed duration of uploaded episode videos.

**Architecture:** Seed a read-only `genres` catalog and store ordered course selections in `course_genres`. Store public duration and video-availability metadata on `lessons` while keeping `lesson_contents.video_url` protected, then feed normalized genre labels and duration totals through the existing display utilities.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL, Vitest, CSS Modules

**Spec:** `docs/superpowers/specs/2026-09-10-course-genres-and-runtime-design.md`

## Global Constraints

- A course accepts zero, one, or two genres from `drama`, `romance`, `thriller`, `fantasy`, and `animation`.
- Public labels preserve the selected position and use uppercase English catalog labels.
- Runtime is stored as non-negative whole seconds and displayed precisely as seconds, minutes and seconds, or hours, minutes and seconds.
- Existing protected video URLs must never become publicly selectable.
- Existing courses with no links display `장르 미등록`; playable lessons with missing duration display `시간 미등록`.
- Do not add dependencies or change package, lock, TypeScript, lint, formatting, authentication, or deployment configuration.
- Keep each implementation slice in a separate feature-focused commit.

---

## File Map

- Create `supabase/migrations/20260910090000_add_course_genres_and_runtime.sql`: relational genre schema, seed data, RLS, genre replacement RPC, lesson metadata and existing-video backfill.
- Modify `supabase/schema.sql`: idempotent canonical schema matching the migration.
- Create `src/lib/courses/genres.ts`: stable genre slugs, form validation, selection toggle, and public label formatting.
- Create `src/lib/courses/genres.test.ts`: genre parsing and selection behavior.
- Modify `src/lib/courses/types.ts`: add genre slugs and optional duration to form input types.
- Modify `src/lib/courses/course-form.ts`: parse repeated genres and duration seconds.
- Modify `src/lib/courses/course-form.test.ts`: parser regression coverage.
- Create `src/lib/courses/course-runtime.ts`: exact formatting and complete playable-runtime aggregation.
- Create `src/lib/courses/course-runtime.test.ts`: runtime edge cases.
- Create `src/app/admin/courses/genre-selector.tsx`: accessible maximum-two genre control.
- Create `src/app/admin/courses/genre-selector.test.ts`: server-rendered control coverage.
- Modify `src/app/admin/courses/thumbnail-uploader.tsx`: hidden duration field and media metadata capture.
- Modify `src/app/admin/courses/thumbnail-uploader.test.ts`: duration field coverage.
- Modify `src/app/admin/courses/new/page.tsx`: fetch catalog and render genre selector.
- Modify `src/app/admin/courses/[courseId]/edit/page.tsx`: load selected genres and stored episode duration.
- Modify `src/app/admin/courses/actions.ts`: persist genre links and public lesson metadata.
- Modify `src/app/admin/courses/course-registration-flow.test.ts`: registration genre coverage.
- Modify `src/app/admin/admin-video-room.module.css`: genre selector layout and states.
- Modify `src/lib/courses/course-display.ts`: accept actual runtime rather than estimate it.
- Modify `src/lib/courses/course-display.test.ts`: exact runtime display contract.
- Modify `src/lib/courses/video-room-display.ts`: consume stored genre labels and runtime.
- Modify `src/lib/courses/video-room-display.test.ts`: remove index rotation assumptions.
- Modify `src/app/main/page.tsx`: query relational genres and public lesson metadata, then aggregate by course.
- Modify `src/app/courses/[courseId]/page.tsx`: show relational genres and exact course runtime.

---

### Task 1: Relational Metadata Foundation

**Files:**
- Create: `supabase/migrations/20260910090000_add_course_genres_and_runtime.sql`
- Modify: `supabase/schema.sql`
- Create: `src/lib/courses/genres.ts`
- Create: `src/lib/courses/genres.test.ts`
- Create: `src/lib/courses/course-runtime.ts`
- Create: `src/lib/courses/course-runtime.test.ts`
- Modify: `src/lib/courses/types.ts`
- Modify: `src/lib/courses/course-form.ts`
- Modify: `src/lib/courses/course-form.test.ts`

**Interfaces:**
- Produces: `GenreSlug`, `GenreOption`, `GENRE_SLUGS`, `parseGenreSlugs(values)`, `toggleGenreSelection(selected, slug)`, and `formatGenreLabels(labels)`.
- Produces: `sumPlayableRuntimeSeconds(durations)` and `formatRuntimeLabel(durationSeconds)`.
- Produces: `CourseFormInput.genreSlugs: GenreSlug[]` and `LessonFormInput.durationSeconds: number | null`.
- Produces: database RPC `replace_course_genres(target_course_id uuid, selected_genre_slugs text[])`.

- [ ] **Step 1: Write failing genre and duration tests**

Add tests with these contracts:

```ts
expect(parseGenreSlugs([])).toEqual({ ok: true, value: [] });
expect(parseGenreSlugs(['drama', 'fantasy'])).toEqual({
  ok: true,
  value: ['drama', 'fantasy'],
});
expect(parseGenreSlugs(['drama', 'drama'])).toEqual({
  ok: true,
  value: ['drama'],
});
expect(parseGenreSlugs(['drama', 'fantasy', 'romance']).ok).toBe(false);
expect(parseGenreSlugs(['unknown']).ok).toBe(false);
expect(toggleGenreSelection(['drama'], 'fantasy')).toEqual([
  'drama',
  'fantasy',
]);
expect(toggleGenreSelection(['drama', 'fantasy'], 'romance')).toEqual([
  'drama',
  'fantasy',
]);
expect(formatGenreLabels(['DRAMA', 'FANTASY'])).toBe('DRAMA · FANTASY');
expect(formatGenreLabels([])).toBe('장르 미등록');

expect(sumPlayableRuntimeSeconds([])).toBeNull();
expect(sumPlayableRuntimeSeconds([146, 42])).toBe(188);
expect(sumPlayableRuntimeSeconds([146, null])).toBeNull();
expect(formatRuntimeLabel(42)).toBe('42초');
expect(formatRuntimeLabel(146)).toBe('2분 26초');
expect(formatRuntimeLabel(3788)).toBe('1시간 3분 8초');
expect(formatRuntimeLabel(null)).toBe('시간 미등록');
```

Extend `course-form.test.ts` so course forms accept two genres and reject three or invalid slugs, while lesson forms accept an empty duration as null and reject negative or malformed values.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
pnpm.cmd test -- src/lib/courses/genres.test.ts src/lib/courses/course-runtime.test.ts src/lib/courses/course-form.test.ts
```

Expected: FAIL because the new modules, fields, and parsing behavior do not exist.

- [ ] **Step 3: Implement the domain helpers and form parsing**

Use these public shapes:

```ts
export const GENRE_SLUGS = [
  'drama',
  'romance',
  'thriller',
  'fantasy',
  'animation',
] as const;

export type GenreSlug = (typeof GENRE_SLUGS)[number];
export type GenreOption = {
  slug: GenreSlug;
  labelKo: string;
  labelEn: string;
};

export function parseGenreSlugs(
  values: FormDataEntryValue[],
): { ok: true; value: GenreSlug[] } | { ok: false; error: string };

export function toggleGenreSelection(
  selected: GenreSlug[],
  slug: GenreSlug,
): GenreSlug[];

export function formatGenreLabels(labels: string[]): string;

export function sumPlayableRuntimeSeconds(
  durations: Array<number | null>,
): number | null;

export function formatRuntimeLabel(durationSeconds: number | null): string;
```

`parseCourseForm` must call `formData.getAll('genres')`. `parseLessonForm` must treat an empty `durationSeconds` as null and reject any non-integer or negative value.

- [ ] **Step 4: Add the migration and canonical schema**

Create `genres` and `course_genres` with the keys and constraints from the spec. Seed the fixed catalog idempotently:

```sql
insert into public.genres (slug, label_ko, label_en, sort_order)
values
  ('drama', '드라마', 'DRAMA', 1),
  ('romance', '로맨스', 'ROMANCE', 2),
  ('thriller', '스릴러', 'THRILLER', 3),
  ('fantasy', '판타지', 'FANTASY', 4),
  ('animation', '애니메이션', 'ANIMATION', 5)
on conflict (slug) do update set
  label_ko = excluded.label_ko,
  label_en = excluded.label_en,
  sort_order = excluded.sort_order;
```

Add `lessons.duration_seconds integer` and `lessons.has_video boolean not null default false`, a non-negative duration constraint, and this backfill:

```sql
update public.lessons as lesson
set has_video = exists (
  select 1
  from public.lesson_contents as content
  where content.lesson_id = lesson.id
    and nullif(trim(content.video_url), '') is not null
);
```

Enable RLS on both genre tables. Allow `anon` and `authenticated` to select catalog and links; permit link writes only when `public.is_admin(auth.uid())`. Implement `replace_course_genres` as a security-invoker PL/pgSQL function that validates a maximum of two distinct seeded slugs, deletes existing links, and inserts replacements with `WITH ORDINALITY` positions.

- [ ] **Step 5: Run foundation tests and static checks**

Run:

```powershell
pnpm.cmd test -- src/lib/courses/genres.test.ts src/lib/courses/course-runtime.test.ts src/lib/courses/course-form.test.ts
.\node_modules\.bin\tsc.cmd --noEmit -p .\tsconfig.build.json
git diff --check
```

Expected: all commands pass.

- [ ] **Step 6: Commit the metadata foundation**

```powershell
git add supabase/schema.sql supabase/migrations/20260910090000_add_course_genres_and_runtime.sql src/lib/courses/genres.ts src/lib/courses/genres.test.ts src/lib/courses/course-runtime.ts src/lib/courses/course-runtime.test.ts src/lib/courses/types.ts src/lib/courses/course-form.ts src/lib/courses/course-form.test.ts
git commit -m "feat: add relational genres and runtime metadata"
```

---

### Task 2: Administrator Genre and Duration Input

**Files:**
- Create: `src/app/admin/courses/genre-selector.tsx`
- Create: `src/app/admin/courses/genre-selector.test.ts`
- Modify: `src/app/admin/courses/thumbnail-uploader.tsx`
- Modify: `src/app/admin/courses/thumbnail-uploader.test.ts`
- Modify: `src/app/admin/courses/new/page.tsx`
- Modify: `src/app/admin/courses/[courseId]/edit/page.tsx`
- Modify: `src/app/admin/courses/actions.ts`
- Modify: `src/app/admin/courses/course-registration-flow.test.ts`
- Modify: `src/app/admin/admin-video-room.module.css`

**Interfaces:**
- Consumes: `GenreOption`, `GenreSlug`, `toggleGenreSelection`, `CourseFormInput.genreSlugs`, `LessonFormInput.durationSeconds`, and RPC `replace_course_genres`.
- Produces: `GenreSelector({ options, initialSelected })` with ordered hidden `genres` inputs.
- Produces: `VideoUploader` hidden `durationSeconds` input and optional `initialDurationSeconds` prop.

- [ ] **Step 1: Write failing administrator UI tests**

Add server-rendered assertions:

```ts
expect(genreMarkup).toContain('드라마');
expect(genreMarkup).toContain('판타지');
expect(genreMarkup).toContain('aria-pressed="true"');
expect(genreMarkup).toContain('name="genres"');

expect(videoMarkup).toContain('name="durationSeconds"');
expect(videoMarkup).toContain('value="146"');

expect(registrationMarkup).toContain('장르');
expect(registrationMarkup).toContain('최대 2개');
expect(registrationMarkup).not.toContain('첫 회차 영상');
```

- [ ] **Step 2: Run administrator tests and verify RED**

Run:

```powershell
pnpm.cmd test -- src/app/admin/courses/genre-selector.test.ts src/app/admin/courses/thumbnail-uploader.test.ts src/app/admin/courses/course-registration-flow.test.ts
```

Expected: FAIL because the selector and duration field are missing.

- [ ] **Step 3: Implement the genre selector**

Render semantic `button type="button"` controls with `aria-pressed`. Maintain selection order in client state, use `toggleGenreSelection`, disable unchecked controls at two selections, and emit one hidden input per selected slug:

```tsx
{selected.map((slug) => (
  <input key={slug} name="genres" type="hidden" value={slug} />
))}
```

Show `최대 2개 선택` and a live count such as `1/2` without adding decorative cards.

- [ ] **Step 4: Capture video metadata in `VideoUploader`**

Add `initialDurationSeconds?: number | null` and `durationName?: string`. Keep duration in state, emit the hidden field, and capture metadata from both new and existing preview URLs:

```tsx
<input
  name={durationName}
  readOnly
  type="hidden"
  value={durationSeconds ?? ''}
/>

<video
  onLoadedMetadata={(event) => {
    const seconds = Math.round(event.currentTarget.duration);
    setDurationSeconds(Number.isFinite(seconds) ? seconds : null);
  }}
/>
```

On metadata error, leave the value empty and show `재생시간을 읽지 못했어요. 저장 후 다시 확인해 주세요.` without blocking upload or save.

- [ ] **Step 5: Wire catalog data and persistence into admin pages**

In the new page, use the authenticated Supabase client returned by `requireAdmin()` to select `slug, label_ko, label_en, sort_order` from `genres`. In the edit page, additionally select `genre_slug, position` from `course_genres` and order by position.

Pass stored `duration_seconds` to every existing episode `VideoUploader`. Update `createCourse` and `updateCourse` to call:

```ts
await supabase.rpc('replace_course_genres', {
  selected_genre_slugs: parsed.value.genreSlugs,
  target_course_id: courseId,
});
```

On course creation, delete the newly inserted course and redirect to the invalid-course state if genre replacement fails. On lesson create/update, write these public fields on `lessons`:

```ts
duration_seconds: parsed.value.durationSeconds,
has_video: Boolean(parsed.value.videoUrl),
```

Keep `video_url` only in `lesson_contents`.

- [ ] **Step 6: Style and verify administrator flows**

Add a compact responsive selector group to the existing field column. Verify keyboard focus, selected, disabled, and two-column-to-single-column responsive states at 1440px, 768px, and 375px. Confirm an empty course can still be created before adding episodes.

Run:

```powershell
pnpm.cmd test -- src/app/admin/courses/genre-selector.test.ts src/app/admin/courses/thumbnail-uploader.test.ts src/app/admin/courses/course-registration-flow.test.ts
.\node_modules\.bin\tsc.cmd --noEmit -p .\tsconfig.build.json
pnpm.cmd lint
git diff --check
```

Expected: all commands pass.

- [ ] **Step 7: Commit administrator metadata input**

```powershell
git add src/app/admin/admin-video-room.module.css src/app/admin/courses/genre-selector.tsx src/app/admin/courses/genre-selector.test.ts src/app/admin/courses/thumbnail-uploader.tsx src/app/admin/courses/thumbnail-uploader.test.ts src/app/admin/courses/new/page.tsx src/app/admin/courses/[courseId]/edit/page.tsx src/app/admin/courses/actions.ts src/app/admin/courses/course-registration-flow.test.ts
git commit -m "feat: capture video genres and durations"
```

---

### Task 3: Public Genre and Exact Runtime Display

**Files:**
- Modify: `src/lib/courses/course-display.ts`
- Modify: `src/lib/courses/course-display.test.ts`
- Modify: `src/lib/courses/video-room-display.ts`
- Modify: `src/lib/courses/video-room-display.test.ts`
- Modify: `src/app/main/page.tsx`
- Modify: `src/app/courses/[courseId]/page.tsx`

**Interfaces:**
- Consumes: `formatGenreLabels`, `sumPlayableRuntimeSeconds`, and `formatRuntimeLabel`.
- Changes: `getTapeDisplay` input adds `runtimeSeconds: number | null` and never estimates from lesson count.
- Changes: `VideoRoomSourceCourse` adds `genreLabels: string[]` and `runtimeSeconds: number | null`.

- [ ] **Step 1: Write failing public display tests**

Update the tape display expectation so seven episodes with `runtimeSeconds: 188` produce `3분 8초`, not `약 42분`. Add card tests proving stored labels are preserved regardless of card index:

```ts
const [card] = buildVideoRoomCards([
  {
    id: 'course-1',
    title: '달의 뒷면',
    description: null,
    thumbnailUrl: null,
    lessonCount: 2,
    hasPlayableVideo: true,
    isEnrolled: false,
    genreLabels: ['THRILLER', 'FANTASY'],
    runtimeSeconds: 188,
  },
], 1);

expect(card.genreLabel).toBe('THRILLER · FANTASY');
expect(card.runtimeLabel).toBe('3분 8초');
```

Add a missing-duration case expecting `시간 미등록` and an empty-genre case expecting `장르 미등록`.

- [ ] **Step 2: Run display tests and verify RED**

Run:

```powershell
pnpm.cmd test -- src/lib/courses/course-display.test.ts src/lib/courses/video-room-display.test.ts
```

Expected: FAIL because display helpers still rotate genres and estimate six minutes per episode.

- [ ] **Step 3: Replace generated display values**

Change `getTapeDisplay` to keep episode count and tape tone behavior but set:

```ts
runtimeLabel: formatRuntimeLabel(runtimeSeconds)
```

Remove `genreLabels[index % genreLabels.length]` from `buildVideoRoomCards` and set:

```ts
genreLabel: formatGenreLabels(course.genreLabels),
runtimeLabel: isPlayable
  ? formatRuntimeLabel(course.runtimeSeconds)
  : '편성 대기',
```

- [ ] **Step 4: Query and aggregate metadata on the main page**

Select `duration_seconds` and `has_video` directly with lessons. Remove the public-page `lesson_contents` query. Fetch course genre links with catalog English labels, order by `position`, and build maps keyed by course ID.

For each course, pass only playable lesson durations into `sumPlayableRuntimeSeconds`:

```ts
const playableDurations = courseLessons
  .filter((lesson) => lesson.has_video)
  .map((lesson) => lesson.duration_seconds);
```

Derive `hasPlayableVideo` from `courseLessons.some((lesson) => lesson.has_video)` so protected URLs remain unread.

- [ ] **Step 5: Show metadata on the course detail page**

Extend the existing lessons select to include `duration_seconds, has_video`. Fetch the course's ordered genre links and catalog labels. Use the same playable-duration aggregation and render the genre label inside `detailMeta` alongside episode count, exact runtime, and rental status.

- [ ] **Step 6: Verify public pages and regressions**

Run:

```powershell
pnpm.cmd test
.\node_modules\.bin\tsc.cmd --noEmit -p .\tsconfig.build.json
pnpm.cmd lint
git diff --check
```

After the migration is applied to the connected Supabase project, verify `/main` and one `/courses/[courseId]` page at 1440px, 768px, and 375px. Confirm two genre labels fit or wrap cleanly, exact runtime matches uploaded media, missing legacy duration reads `시간 미등록`, and no horizontal overflow appears.

- [ ] **Step 7: Commit public metadata display**

```powershell
git add src/lib/courses/course-display.ts src/lib/courses/course-display.test.ts src/lib/courses/video-room-display.ts src/lib/courses/video-room-display.test.ts src/app/main/page.tsx src/app/courses/[courseId]/page.tsx
git commit -m "feat: display stored genres and exact runtime"
```

---

### Task 4: Final Review and Migration Handoff

**Files:**
- Review only; no planned source changes.

**Interfaces:**
- Consumes all three feature commits and the connected Supabase schema.
- Produces a clean branch with documented verification results.

- [ ] **Step 1: Review the complete branch diff**

Run:

```powershell
git diff HEAD~3..HEAD --check
git diff HEAD~3..HEAD --stat
git status --short
```

Inspect for public exposure of `video_url`, stale generated-genre arrays, `lessonCount * 6` estimates, unused imports, and unrelated changes.

- [ ] **Step 2: Run the complete verification suite**

Run:

```powershell
pnpm.cmd test
.\node_modules\.bin\tsc.cmd --noEmit -p .\tsconfig.build.json
pnpm.cmd lint
pnpm.cmd build
```

Expected: tests, TypeScript, lint, and build pass. If the existing local pnpm package-permission issue still blocks build, record the exact dependency and error separately rather than changing package metadata.

- [ ] **Step 3: Report migration status**

Confirm whether `20260910090000_add_course_genres_and_runtime.sql` was applied to the connected project. Do not claim live UI verification if the migration was not applied. Report the three feature commit hashes and any remaining environment-only blocker.
