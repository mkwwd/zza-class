# Free LMS MVP PRD

## Overview

ZZA Class is a free learning management system for authenticated users. The
first version focuses on a simple two-role model:

- `admin`: creates and manages courses and lessons.
- `user`: signs up, logs in, enrolls in free courses, and studies lessons.

The product should stay intentionally small. It should make it easy for an
admin to publish learning content and easy for a user to find and start a
course without payment, instructor workflows, quizzes, or complex reporting.

## Goals

- Allow users to sign up and log in with Supabase email/password auth.
- Distinguish `admin` and `user` through `public.profiles.role`.
- Let admins create, edit, publish, unpublish, and delete courses.
- Let admins add, edit, reorder, and delete lessons inside a course.
- Let users browse published courses.
- Let users enroll in a free course.
- Let enrolled users view course lessons.
- Track basic lesson completion for enrolled users.

## Non-Goals

- Paid courses, checkout, coupons, refunds, or invoices.
- Instructor accounts separate from admins.
- Quizzes, assignments, certificates, grading, or discussions.
- Video upload/transcoding inside the app.
- Advanced analytics dashboards.
- Team, organization, or multi-tenant support.

## Users And Roles

### Anonymous Visitor

- Can see the login/signup page.
- Can browse the published course list.
- Can view public course detail/overview information for published courses.
- Cannot enroll in courses.
- Cannot view lesson content, lesson videos, or progress state.
- Is redirected to login when trying to access protected learning pages.

### User

- Can view published courses.
- Can enroll in free courses.
- Can view lessons only after enrollment.
- Can mark lessons complete.
- Cannot create or modify courses, lessons, enrollments for other users, or
  roles.

### Admin

- Can access all user capabilities.
- Can create and manage all courses and lessons.
- Can view enrollment counts and enrolled user emails.
- Can promote users to admin only through direct database update in Supabase SQL
  Editor for the MVP.

## Primary User Flows

### Signup

1. User opens `/`.
2. User clicks `Create account`.
3. User enters email and password.
4. Supabase sends confirmation email when email confirmation is enabled.
5. After confirmation, the user can log in.
6. Database trigger creates a `profiles` row with `role = 'user'`.

### Login

1. User opens `/`.
2. User enters email and password.
3. If credentials are valid, user is redirected to `/main`.
4. If credentials are invalid, login page shows an error.

### User Course Enrollment

1. Visitor or logged-in user opens the published course list.
2. User selects a published course.
3. If anonymous, user can see overview content and is prompted to log in before
   enrolling.
4. Logged-in user clicks `Start course`.
5. App creates an `enrollments` row for that user and course.
6. User can view lessons for that course.

### Lesson Completion

1. Enrolled user opens a lesson.
2. User clicks `Mark complete`.
3. App creates or updates a `lesson_progress` row.
4. Course detail shows completed lesson count.

### Admin Course Management

1. Admin logs in.
2. Admin opens admin dashboard.
3. Admin creates a course with title, description, and publish status.
4. Admin adds lessons with title, content, optional video URL, and sort order.
5. Admin publishes the course.
6. Published course appears to users.

## Information Architecture

- `/`: login/signup
- `/main`: authenticated home
- `/courses`: published course list for visitors and users
- `/courses/[courseId]`: public course detail and enrollment status
- `/courses/[courseId]/lessons/[lessonId]`: lesson viewer
- `/admin`: admin dashboard
- `/admin/courses/new`: create course
- `/admin/courses/[courseId]/edit`: edit course and lessons

For the MVP, `/main` can route users to the relevant entry point:

- admin sees links to admin dashboard and course list.
- user sees links to course list and enrolled courses.

## Data Model

### Existing Table: `profiles`

Purpose: app-level user profile and role.

Columns:

- `id uuid primary key references auth.users(id)`
- `email text`
- `role app_role not null default 'user'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### New Table: `courses`

Purpose: top-level learning product.

Columns:

- `id uuid primary key`
- `title text not null`
- `description text`
- `status text not null default 'draft'`
- `created_by uuid references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Status values:

- `draft`: visible only to admins.
- `published`: visible to users.

### New Table: `lessons`

Purpose: public lesson metadata and ordering inside a course.

Columns:

- `id uuid primary key`
- `course_id uuid references public.courses(id) on delete cascade`
- `title text not null`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### New Table: `lesson_contents`

Purpose: protected lesson body and video data.

Columns:

- `lesson_id uuid primary key references public.lessons(id) on delete cascade`
- `content text`
- `video_url text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### New Table: `enrollments`

Purpose: records free course enrollment.

Columns:

- `id uuid primary key`
- `user_id uuid references auth.users(id) on delete cascade`
- `course_id uuid references public.courses(id) on delete cascade`
- `created_at timestamptz not null default now()`

Constraints:

- unique `(user_id, course_id)`

### New Table: `lesson_progress`

Purpose: basic lesson completion tracking.

Columns:

- `id uuid primary key`
- `user_id uuid references auth.users(id) on delete cascade`
- `lesson_id uuid references public.lessons(id) on delete cascade`
- `completed_at timestamptz not null default now()`

Constraints:

- unique `(user_id, lesson_id)`

## Permissions And RLS

All LMS tables should have RLS enabled.

### Profiles

- Users can select their own row.
- Admins can select all rows.
- No user-facing update policy in the MVP.

### Courses

- Anonymous visitors and authenticated users can select published courses.
- Admins can select all courses.
- Admins can insert, update, and delete courses.

### Lessons

- Anonymous visitors can view only lesson titles and ordering for published
  courses.
- Authenticated users can also view lesson titles and ordering for published
  courses.
- Lesson content, video URLs, and materials are stored separately in
  `lesson_contents` and require login plus enrollment.
- Admins can select all lessons.
- Admins can insert, update, and delete lessons.

### Lesson Contents

- Enrolled users can select lesson content for lessons in their enrolled
  courses.
- Admins can select, insert, update, and delete all lesson contents.
- Anonymous visitors cannot select lesson contents.

### Enrollments

- Users can select their own enrollments.
- Users can insert enrollment rows for themselves.
- Admins can select all enrollments.
- Users cannot enroll other users.

### Lesson Progress

- Users can select and insert their own progress.
- Admins can select all progress.
- Users cannot update or delete other users' progress.

## UI Requirements

### Login And Signup

- Default screen is login.
- Signup form is reachable from the login screen with a button/link.
- Authentication errors are visible and plain.
- If Supabase environment variables are missing, auth buttons are disabled.

### User Course List

- Show only published courses.
- Anonymous visitors can access this page.
- Each course shows title, short description, and enrollment status.
- Empty state appears when no courses are published.

### Course Detail

- Show course title and description.
- Show lesson list using public metadata such as lesson titles.
- If anonymous, show `Login to start`.
- If logged in and not enrolled, show `Start course`.
- If enrolled, lessons are clickable.

### Lesson Viewer

- Show lesson title, optional video URL, and lesson content.
- Show `Mark complete`.
- Show completed state after completion.

### Admin Dashboard

- Show course list including draft and published courses.
- Provide create/edit/delete controls.
- Show course status.
- Show enrollment count per course.

## Error Handling

- Invalid login: redirect to login page with visible error.
- Signup requiring email confirmation: show check-email message.
- Unauthorized admin route access: redirect to `/main`.
- Missing enrollment on lesson access: redirect to course detail.
- Anonymous enrollment attempt: redirect to login.
- Missing Supabase env: keep app usable enough to show setup message.

## Success Metrics

- Admin can publish a course with at least one lesson.
- User can sign up, log in, enroll in that course, and open a lesson.
- Anonymous visitor can browse published courses and view course overview pages.
- User can mark a lesson complete.
- Non-admin users cannot access admin pages or mutate course content.
- Unauthenticated visitors cannot access enrollment, lesson content, progress,
  or admin pages.

## MVP Acceptance Criteria

- Email/password auth works with Supabase.
- `profiles.role` controls admin-only UI and routes.
- Admin can manage courses and lessons.
- User can browse only published courses.
- Anonymous visitors can browse published course listings and overview pages.
- User can enroll in a free course.
- User can view lessons only after enrollment.
- User can mark lessons complete.
- RLS policies prevent unauthorized reads and writes.
- `pnpm build` and TypeScript checks pass.

## Open Decisions For Later

- Whether lesson content should be Markdown, rich text, or plain textarea.
- Whether video URLs will come from YouTube, Vimeo, Supabase Storage, or another
  hosting provider.
- Whether users need a dedicated "My Courses" page in the MVP or whether `/main`
  is enough.
- Whether admin promotion should remain SQL-only or move into an admin UI later.
