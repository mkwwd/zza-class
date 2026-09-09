# VIDEO ROOM Course Genres and Runtime Design

## Goal

Replace temporary genre rotation and estimated `episode count x 6 minutes` labels with administrator-selected genres and actual uploaded video durations.

## Scope

- Allow an administrator to select up to two genres for a course.
- Read each episode video's duration from browser media metadata.
- Persist the duration with the episode content.
- Display the sum of known episode durations on the main and course detail pages.
- Preserve the existing VIDEO ROOM visual system and registration flow.

This change does not add genre administration, arbitrary custom genres, server-side media probing, or automatic background backfills.

## Data Model

Create a fixed genre catalog and a course-to-genre link table through a Supabase migration, then mirror them in `supabase/schema.sql`:

```sql
create table public.genres (
  slug text primary key,
  label_ko text not null,
  label_en text not null,
  sort_order smallint not null unique
);

create table public.course_genres (
  course_id uuid not null references public.courses(id) on delete cascade,
  genre_slug text not null references public.genres(slug),
  position smallint not null check (position between 1 and 2),
  primary key (course_id, genre_slug),
  unique (course_id, position)
);

alter table public.lessons
  add column if not exists duration_seconds integer,
  add column if not exists has_video boolean not null default false;
```

The migration seeds `drama`, `romance`, `thriller`, `fantasy`, and `animation`. Public and authenticated users may read both genre tables; only administrators may create, update, or delete course links. Database constraints enforce:

- A course has at most two genre links through unique positions `1` and `2`.
- Every course genre references a seeded catalog row.
- `duration_seconds` is null or a non-negative integer.

Duration and video availability belong to `lessons`, whose metadata is readable for published courses. The protected `lesson_contents.video_url` remains available only to enrolled users and administrators. The migration backfills `lessons.has_video` from existing non-empty lesson content URLs without exposing those URLs.

The application submits stable lowercase slugs. Administration UI reads Korean labels from the catalog, while public cards use the catalog's uppercase English labels.

## Administration Flow

### Course registration and editing

The new-course and course-edit forms show five checkbox-style genre controls:

- 드라마
- 로맨스
- 스릴러
- 판타지
- 애니메이션

Zero, one, or two selections are accepted. Selecting a third option is prevented in the UI and rejected by server-side form parsing. Selected order is stored as `course_genres.position`; no links are stored for an empty selection, which displays as `장르 미등록`.

### Episode upload and editing

`VideoUploader` listens for the video element's `loadedmetadata` event and writes `Math.round(video.duration)` to a hidden `durationSeconds` form field. New uploads capture duration immediately after the local file is selected, independent of the R2 upload response.

For existing videos without stored duration, the edit preview reads metadata from the existing URL. The derived value remains local until the administrator submits `회차 저장`. This avoids an unexpected write merely from opening an edit page.

If metadata cannot be read, the upload and lesson form remain usable. The hidden field stays empty and the stored value remains null.

## Server Data Flow

- `parseCourseForm` parses repeated `genres` form values, de-duplicates them, validates the seeded slug allowlist, and enforces the two-genre maximum.
- `createCourse` and `updateCourse` replace the course's `course_genres` rows with positions matching the submitted order.
- `parseLessonForm` accepts an optional `durationSeconds` value and validates it as a non-negative integer.
- `addLesson` and `updateLesson` persist duration and video availability to `lessons`, while the protected URL remains in `lesson_contents`.
- Main-page queries select genre links with catalog labels plus public lesson duration and availability metadata. Durations are grouped by course and summed only when every playable episode has a known duration.
- Course-detail queries select lesson content durations and use the same aggregation utility.

## Display Rules

Genre labels preserve selected order and render with ` · ` between values. Examples:

- `DRAMA`
- `DRAMA · FANTASY`
- `장르 미등록`

Runtime uses actual summed seconds:

- Under one minute: `42초`
- Under one hour: `2분 26초`
- One hour or longer: `1시간 3분 8초`
- No episodes or any missing duration: `시간 미등록`
- Coming-soon placeholder tapes retain `편성 대기`.

The old index-based genre rotation and six-minutes-per-episode estimate are removed.

## Error Handling

- Invalid or excessive genre values return the existing invalid-course redirect state.
- Invalid duration values return the existing invalid-lesson redirect state.
- Browser metadata failures do not block upload; the UI explains that time will remain unregistered.
- Existing courses remain valid with no genre links. Existing lessons retain nullable duration, and their video availability is backfilled from protected lesson content during migration.

## Testing

- Course form tests cover zero, one, two, duplicate, invalid, and excessive genres.
- Lesson form tests cover valid, missing, negative, and malformed durations.
- Runtime formatter tests cover seconds, minutes, hours, and missing data.
- Video-room card tests prove genres come from stored values rather than list position.
- Uploader component tests prove the duration hidden field is present.
- Registration-flow tests prove genre controls appear without reintroducing first-episode fields.
- Run TypeScript, ESLint, Vitest, `git diff --check`, and responsive browser checks at desktop and mobile widths.

## Delivery

Implementation will be split into feature-focused commits:

1. Relational genre schema and parsing support for genres and duration.
2. Administration form and uploader metadata capture.
3. Public runtime aggregation and genre display.
