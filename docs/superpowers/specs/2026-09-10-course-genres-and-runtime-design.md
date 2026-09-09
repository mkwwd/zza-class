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

Add the following columns through a Supabase migration and mirror them in `supabase/schema.sql`:

```sql
alter table public.courses
  add column if not exists genres text[] not null default '{}';

alter table public.lesson_contents
  add column if not exists duration_seconds integer;
```

Database constraints will enforce:

- `genres` contains no more than two values.
- Every genre value is one of `drama`, `romance`, `thriller`, `fantasy`, or `animation`.
- `duration_seconds` is null or a non-negative integer.

The application uses stable lowercase values in storage and Korean labels in administration UI. Public cards use the existing uppercase English labels.

## Administration Flow

### Course registration and editing

The new-course and course-edit forms show five checkbox-style genre controls:

- 드라마
- 로맨스
- 스릴러
- 판타지
- 애니메이션

Zero, one, or two selections are accepted. Selecting a third option is prevented in the UI and rejected by server-side form parsing. An empty selection is stored as an empty array and displayed as `장르 미등록`.

### Episode upload and editing

`VideoUploader` listens for the video element's `loadedmetadata` event and writes `Math.round(video.duration)` to a hidden `durationSeconds` form field. New uploads capture duration immediately after the local file is selected, independent of the R2 upload response.

For existing videos without stored duration, the edit preview reads metadata from the existing URL. The derived value remains local until the administrator submits `회차 저장`. This avoids an unexpected write merely from opening an edit page.

If metadata cannot be read, the upload and lesson form remain usable. The hidden field stays empty and the stored value remains null.

## Server Data Flow

- `parseCourseForm` parses repeated `genres` form values, de-duplicates them, validates the allowlist, and enforces the two-genre maximum.
- `createCourse` and `updateCourse` persist the parsed genre array.
- `parseLessonForm` accepts an optional `durationSeconds` value and validates it as a non-negative integer.
- `addLesson` and `updateLesson` persist duration to `lesson_contents.duration_seconds`.
- Main-page queries select course genres and lesson durations. Durations are grouped by course and summed only when every playable episode has a known duration.
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
- Existing rows remain valid because genres default to an empty array and duration is nullable.

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

1. Database and parsing support for genres and duration.
2. Administration form and uploader metadata capture.
3. Public runtime aggregation and genre display.
