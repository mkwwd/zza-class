# VIDEO ROOM Connected Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build five connected VIDEO ROOM pages and remove document-level width gaps without changing the existing Supabase schema.

**Architecture:** A shared server-rendered app shell and visual primitives provide consistent navigation, VHS materials, and responsive behavior. Existing pages keep their Supabase queries and access checks while adopting focused display helpers; the new My Bag page derives its sections from enrollments, lessons, and progress rows.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, Tailwind CSS 4, CSS Modules, Supabase, Lucide React, Vitest

**Spec:** `docs/superpowers/specs/2026-09-02-video-room-pages-design.md`

## Global Constraints

- Preserve the existing Supabase schema and access-control behavior.
- Use Server Components by default and isolate upload interactivity in the existing client uploader.
- Keep VIDEO ROOM, blue-eyed Staff Cat, dark navy, violet, warm orange, and off-white as the durable identity.
- Do not add dependencies or invent unavailable commercial metadata.
- Verify 1440px, 1024px, 768px, and 375px with no horizontal overflow.

---

### Task 1: Display Models And Creation Flow

**Files:**
- Create: `src/lib/courses/video-room-pages.ts`
- Test: `src/lib/courses/video-room-pages.test.ts`
- Modify: `src/lib/courses/course-form.ts`
- Modify: `src/lib/courses/course-form.test.ts`
- Modify: `src/app/admin/courses/actions.ts`

**Interfaces:**
- Produces `partitionMyBagTitles(titles)` for rented/completed sections.
- Produces `getEpisodeNavigation(episodes, lessonId)` for previous/next links.
- Produces `parseInitialEpisodeForm(formData)` for optional first-episode creation.

- [ ] Write failing tests for progress partitioning, episode navigation, and optional first-episode parsing.
- [ ] Run `npm.cmd test -- src/lib/courses/video-room-pages.test.ts src/lib/courses/course-form.test.ts` and confirm the new expectations fail.
- [ ] Implement the typed helpers and extend `createCourse` to insert an optional first lesson and lesson content.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Shared VIDEO ROOM Shell

**Files:**
- Create: `src/components/video-room/VideoRoomShell.tsx`
- Create: `src/components/video-room/VideoRoomVisuals.tsx`
- Create: `src/components/video-room/video-room-shell.module.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/main/page.tsx`

**Interfaces:**
- `VideoRoomShell` accepts `activeItem`, `bagCount`, `isAdmin`, `mode`, and `children`.
- `VhsTape`, `VideoCase`, `StaffCatBadge`, and `EmptyTape` provide shared visual language.

- [ ] Add the shell and visual primitives using semantic navigation and Lucide icons.
- [ ] Make `html`, `body`, and page roots full-width with clipped accidental horizontal overflow and dark backgrounds.
- [ ] Point the main-page My Bag links to `/my-page` while preserving the existing hero composition.
- [ ] Run TypeScript to catch prop and route integration errors.

### Task 3: User Detail, Playback, And My Bag

**Files:**
- Modify: `src/app/courses/[courseId]/page.tsx`
- Modify: `src/app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- Create: `src/app/my-page/page.tsx`
- Create: `src/app/video-room-pages.module.css`

**Interfaces:**
- Consumes the shared shell and page helpers from Tasks 1 and 2.
- Keeps `enrollInCourse` and `markLessonComplete` as existing server actions.

- [ ] Rebuild the detail page around artwork, title information, My Bag state, and an episode shelf.
- [ ] Rebuild playback around a responsive CRT frame, native video controls, navigation, and completion action.
- [ ] Query enrollments, lessons, and progress for `/my-page` and render rented/completed sections.
- [ ] Add loading-safe and empty states without fake data.

### Task 4: Staff Inventory, Registration, And Episode Editor

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/courses/new/page.tsx`
- Modify: `src/app/admin/courses/[courseId]/edit/page.tsx`
- Modify: `src/app/admin/courses/thumbnail-uploader.tsx`
- Create: `src/app/admin/admin-video-room.module.css`

**Interfaces:**
- Inventory uses `searchParams` keys `q` and `status`.
- New-title form sends `episodeTitle`, `videoUrl`, and existing course fields to `createCourse`.

- [ ] Replace the light admin dashboard with a responsive Staff Only inventory table and real filters.
- [ ] Build the title-and-optional-first-episode registration form using the existing R2 upload client.
- [ ] Restyle the edit page as an episode editor where later episodes are added and managed.
- [ ] Ensure uploader default, uploading, success, error, image, video, and empty states use the shared dark vocabulary.

### Task 5: Verification And Visual QA

**Files:**
- Modify only files with defects found during verification.
- Create: `.impeccable/review/desktop.png`
- Create: `.impeccable/review/mobile.png`
- Create: `.impeccable/review/user-1440.png`

**Interfaces:**
- Produces a verified build with measured viewport/document equality at each target width.

- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd run build`.
- [ ] Run the Impeccable detector once over all changed UI targets.
- [ ] Capture desktop and mobile pages in one browser pass and measure `documentElement.clientWidth`, `body.scrollWidth`, and each page root width.
- [ ] Batch-fix all observed clipping, overflow, contrast, focus, and responsive issues, then perform one confirmation pass.
