# Free LMS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the free LMS MVP from the PRD: public published course browsing, Supabase email auth, admin course/lesson management, free enrollment, protected lesson viewing, and lesson completion.

**Architecture:** Keep the app on Next App Router and Supabase SSR. Use server components for data-loaded pages, server actions for mutations, and small pure helper modules for role/access decisions so behavior can be tested first. Supabase RLS remains the final authorization boundary; app guards provide UX redirects.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript, Tailwind CSS 4, Supabase Auth/Database, `@supabase/ssr`, `@supabase/supabase-js`, Vitest for unit tests.

**Spec:** `memory-bank/2026-08-19-lms-free-mvp-prd.md`

## Global Constraints

- Free courses only; no paid courses, checkout, coupons, refunds, or invoices.
- Roles are limited to `admin` and `user`.
- Admin promotion remains SQL-only for the MVP.
- Anonymous visitors can browse published course listings and course overview pages.
- Lesson content, video URLs, materials, and progress require login and enrollment.
- All LMS tables must have RLS enabled.
- `pnpm build` and TypeScript checks must pass.

---

## File Structure

- `supabase/schema.sql`: Database schema, triggers, helper functions, and RLS policies.
- `src/lib/auth/access.ts`: Pure role/access helper functions.
- `src/lib/auth/access.test.ts`: Unit tests for role/access helper functions.
- `src/lib/courses/types.ts`: Shared LMS TypeScript types.
- `src/lib/courses/course-form.ts`: Pure validation and form parsing for course/lesson mutations.
- `src/lib/courses/course-form.test.ts`: Unit tests for course/lesson form parsing.
- `src/app/actions.ts`: Existing auth actions only.
- `src/app/main/page.tsx`: Authenticated home with role-aware links.
- `src/app/courses/page.tsx`: Public published course list.
- `src/app/courses/[courseId]/page.tsx`: Public course overview plus enrollment CTA/state.
- `src/app/courses/[courseId]/lessons/[lessonId]/page.tsx`: Protected lesson viewer.
- `src/app/courses/actions.ts`: Enrollment and lesson progress server actions.
- `src/app/admin/page.tsx`: Admin course dashboard.
- `src/app/admin/courses/new/page.tsx`: Admin create course page.
- `src/app/admin/courses/[courseId]/edit/page.tsx`: Admin course/lesson edit page.
- `src/app/admin/courses/actions.ts`: Admin course and lesson server actions.
- `package.json`: Add test scripts and Vitest dependency.
- `vitest.config.ts`: Vitest configuration for TypeScript tests.

---

## Task 1: Test Harness And Access Helpers

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/auth/access.ts`
- Create: `src/lib/auth/access.test.ts`

**Interfaces:**
- Produces: `type Role = 'admin' | 'user'`
- Produces: `isAdmin(role: Role | null | undefined): boolean`
- Produces: `canManageCourses(role: Role | null | undefined): boolean`
- Produces: `canViewLessonContent(input: { role?: Role | null; isEnrolled: boolean }): boolean`
- Produces: `getAuthenticatedRedirect(userId?: string | null): '/' | null`

- [ ] **Step 1: Add Vitest dependencies**

Run:

```bash
pnpm add -D vitest
```

Expected: `vitest` appears in `devDependencies`.

- [ ] **Step 2: Add test scripts**

In `package.json`, add:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Keep existing `dev`, `build`, `start`, and `lint` scripts.

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write failing access helper tests**

Create `src/lib/auth/access.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import {
  canManageCourses,
  canViewLessonContent,
  getAuthenticatedRedirect,
  isAdmin,
} from './access';

describe('access helpers', () => {
  it('treats only admin role as admin', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('user')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it('allows only admins to manage courses', () => {
    expect(canManageCourses('admin')).toBe(true);
    expect(canManageCourses('user')).toBe(false);
    expect(canManageCourses(undefined)).toBe(false);
  });

  it('allows lesson content for admins or enrolled users only', () => {
    expect(canViewLessonContent({ role: 'admin', isEnrolled: false })).toBe(
      true,
    );
    expect(canViewLessonContent({ role: 'user', isEnrolled: true })).toBe(true);
    expect(canViewLessonContent({ role: 'user', isEnrolled: false })).toBe(
      false,
    );
    expect(canViewLessonContent({ role: null, isEnrolled: false })).toBe(false);
  });

  it('redirects missing users to login', () => {
    expect(getAuthenticatedRedirect()).toBe('/');
    expect(getAuthenticatedRedirect(null)).toBe('/');
    expect(getAuthenticatedRedirect('user-1')).toBeNull();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run:

```bash
pnpm test src/lib/auth/access.test.ts
```

Expected: FAIL because `src/lib/auth/access.ts` does not exist.

- [ ] **Step 6: Implement access helpers**

Create `src/lib/auth/access.ts`:

```ts
export type Role = 'admin' | 'user';

export function isAdmin(role: Role | null | undefined) {
  return role === 'admin';
}

export function canManageCourses(role: Role | null | undefined) {
  return isAdmin(role);
}

export function canViewLessonContent({
  role,
  isEnrolled,
}: {
  role?: Role | null;
  isEnrolled: boolean;
}) {
  return isAdmin(role) || isEnrolled;
}

export function getAuthenticatedRedirect(userId?: string | null) {
  return userId ? null : '/';
}
```

- [ ] **Step 7: Run test to verify it passes**

Run:

```bash
pnpm test src/lib/auth/access.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/lib/auth/access.ts src/lib/auth/access.test.ts
git commit -m "test: add access helper coverage"
```

---

## Task 2: Supabase LMS Schema And RLS

**Files:**
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces tables: `courses`, `lessons`, `lesson_contents`, `enrollments`, `lesson_progress`
- Produces helper functions: `public.is_admin(uuid)`, `public.is_enrolled(uuid, uuid)`
- Consumes existing table: `profiles`

- [ ] **Step 1: Extend schema with LMS tables**

Update `supabase/schema.sql` so it includes:

```sql
create type public.course_status as enum ('draft', 'published');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.course_status not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_contents (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  content text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
```

- [ ] **Step 2: Enable RLS**

Add:

```sql
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_contents enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
```

- [ ] **Step 3: Add enrollment helper**

Add:

```sql
create or replace function public.is_enrolled(user_id uuid, target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments
    where enrollments.user_id = is_enrolled.user_id
      and enrollments.course_id = target_course_id
  );
$$;
```

- [ ] **Step 4: Add course policies**

Add:

```sql
create policy "Anyone can view published courses"
on public.courses
for select
to anon, authenticated
using (status = 'published');

create policy "Admins can view all courses"
on public.courses
for select
to authenticated
using (public.is_admin((select auth.uid())));

create policy "Admins can create courses"
on public.courses
for insert
to authenticated
with check (public.is_admin((select auth.uid())));

create policy "Admins can update courses"
on public.courses
for update
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

create policy "Admins can delete courses"
on public.courses
for delete
to authenticated
using (public.is_admin((select auth.uid())));
```

- [ ] **Step 5: Add lesson policies**

Add:

```sql
create policy "Anyone can view published lesson metadata"
on public.lessons
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = lessons.course_id
      and courses.status = 'published'
  )
);

create policy "Admins can manage lessons"
on public.lessons
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));
```

Implementation note: RLS is row-level, not column-level. Keep `lessons` limited
to public metadata and store protected body/video fields in `lesson_contents`.
This prevents anonymous clients from reading lesson content through a broad
Supabase query.

- [ ] **Step 6: Add lesson content policies**

Add:

```sql
create policy "Enrolled users can view lesson contents"
on public.lesson_contents
for select
to authenticated
using (
  public.is_enrolled(
    (select auth.uid()),
    (
      select lessons.course_id
      from public.lessons
      where lessons.id = lesson_contents.lesson_id
    )
  )
);

create policy "Admins can manage lesson contents"
on public.lesson_contents
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));
```

- [ ] **Step 7: Add enrollment and progress policies**

Add:

```sql
create policy "Users can view own enrollments"
on public.enrollments
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can enroll themselves"
on public.enrollments
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Admins can view all enrollments"
on public.enrollments
for select
to authenticated
using (public.is_admin((select auth.uid())));

create policy "Users can view own lesson progress"
on public.lesson_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own lesson progress"
on public.lesson_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Admins can view all lesson progress"
on public.lesson_progress
for select
to authenticated
using (public.is_admin((select auth.uid())));
```

- [ ] **Step 8: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add LMS database schema"
```

---

## Task 3: Course And Lesson Form Validation

**Files:**
- Create: `src/lib/courses/types.ts`
- Create: `src/lib/courses/course-form.ts`
- Create: `src/lib/courses/course-form.test.ts`

**Interfaces:**
- Produces: `type CourseStatus = 'draft' | 'published'`
- Produces: `parseCourseForm(formData: FormData): { ok: true; value: CourseFormInput } | { ok: false; error: string }`
- Produces: `parseLessonForm(formData: FormData): { ok: true; value: LessonFormInput } | { ok: false; error: string }`

- [ ] **Step 1: Write failing form tests**

Create `src/lib/courses/course-form.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { parseCourseForm, parseLessonForm } from './course-form';

describe('course form parsing', () => {
  it('accepts valid course data', () => {
    const formData = new FormData();
    formData.set('title', 'React Basics');
    formData.set('description', 'Start learning React.');
    formData.set('status', 'published');

    expect(parseCourseForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'React Basics',
        description: 'Start learning React.',
        status: 'published',
      },
    });
  });

  it('rejects missing course title', () => {
    const formData = new FormData();
    formData.set('status', 'draft');

    expect(parseCourseForm(formData)).toEqual({
      ok: false,
      error: 'Course title is required.',
    });
  });
});

describe('lesson form parsing', () => {
  it('accepts valid lesson data', () => {
    const formData = new FormData();
    formData.set('title', 'What is React?');
    formData.set('content', 'React is a UI library.');
    formData.set('videoUrl', 'https://example.com/video');
    formData.set('sortOrder', '2');

    expect(parseLessonForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'What is React?',
        content: 'React is a UI library.',
        videoUrl: 'https://example.com/video',
        sortOrder: 2,
      },
    });
  });

  it('normalizes invalid sort order to zero', () => {
    const formData = new FormData();
    formData.set('title', 'Intro');
    formData.set('sortOrder', 'abc');

    expect(parseLessonForm(formData)).toEqual({
      ok: true,
      value: {
        title: 'Intro',
        content: '',
        videoUrl: '',
        sortOrder: 0,
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test src/lib/courses/course-form.test.ts
```

Expected: FAIL because `src/lib/courses/course-form.ts` does not exist.

- [ ] **Step 3: Create shared types**

Create `src/lib/courses/types.ts`:

```ts
export type CourseStatus = 'draft' | 'published';

export type CourseFormInput = {
  title: string;
  description: string;
  status: CourseStatus;
};

export type LessonFormInput = {
  title: string;
  content: string;
  videoUrl: string;
  sortOrder: number;
};
```

- [ ] **Step 4: Implement form parsing**

Create `src/lib/courses/course-form.ts`:

```ts
import type { CourseFormInput, CourseStatus, LessonFormInput } from './types';

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function readStatus(formData: FormData): CourseStatus {
  return readString(formData, 'status') === 'published' ? 'published' : 'draft';
}

export function parseCourseForm(
  formData: FormData,
): { ok: true; value: CourseFormInput } | { ok: false; error: string } {
  const title = readString(formData, 'title');

  if (!title) {
    return { ok: false, error: 'Course title is required.' };
  }

  return {
    ok: true,
    value: {
      title,
      description: readString(formData, 'description'),
      status: readStatus(formData),
    },
  };
}

export function parseLessonForm(
  formData: FormData,
): { ok: true; value: LessonFormInput } | { ok: false; error: string } {
  const title = readString(formData, 'title');

  if (!title) {
    return { ok: false, error: 'Lesson title is required.' };
  }

  const sortOrder = Number.parseInt(readString(formData, 'sortOrder'), 10);

  return {
    ok: true,
    value: {
      title,
      content: readString(formData, 'content'),
      videoUrl: readString(formData, 'videoUrl'),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test src/lib/courses/course-form.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/courses/types.ts src/lib/courses/course-form.ts src/lib/courses/course-form.test.ts
git commit -m "test: add course form parsing"
```

---

## Task 4: Public Course List And Course Overview

**Files:**
- Create: `src/app/courses/page.tsx`
- Create: `src/app/courses/[courseId]/page.tsx`
- Modify: `src/app/main/page.tsx`

**Interfaces:**
- Consumes: Supabase `courses` and `lessons` tables.
- Produces route: `/courses`
- Produces route: `/courses/[courseId]`

- [ ] **Step 1: Read local Next.js docs for App Router pages**

Run:

```bash
Get-Content node_modules\next\dist\docs\01-app\01-getting-started\03-layouts-and-pages.md
```

Use App Router `page.tsx` files with async server components.

- [ ] **Step 2: Create public course list page**

Create `src/app/courses/page.tsx`:

```tsx
import Link from 'next/link';

import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="min-h-dvh bg-[#f5f7fb] px-5 py-8 text-slate-950">
        <section className="mx-auto max-w-5xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Add Supabase environment variables to load courses.
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-dvh bg-[#f5f7fb] px-5 py-8 text-slate-950">
      <section className="mx-auto flex max-w-5xl flex-col gap-5">
        <div>
          <p className="text-sm font-semibold text-cyan-700">ZZA Class</p>
          <h1 className="mt-2 text-2xl font-semibold">Courses</h1>
        </div>

        {courses?.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <li
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={course.id}>
                <h2 className="text-lg font-semibold">{course.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {course.description}
                </p>
                <Link
                  className="mt-4 inline-flex h-10 items-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white"
                  href={`/courses/${course.id}`}>
                  View course
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No published courses yet.
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Create public course overview page**

Create `src/app/courses/[courseId]/page.tsx` with:

```tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { enrollInCourse } from '../actions';
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: PageProps<'/courses/[courseId]'>) {
  if (!hasSupabaseEnv()) {
    redirect('/courses');
  }

  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, status')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) {
    notFound();
  }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order')
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });

  const { data: enrollment } = user
    ? await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', course.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="min-h-dvh bg-[#f5f7fb] px-5 py-8 text-slate-950">
      <section className="mx-auto flex max-w-4xl flex-col gap-5">
        <Link className="text-sm font-semibold text-cyan-700" href="/courses">
          Back to courses
        </Link>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {course.description}
          </p>

          {user ? (
            enrollment ? (
              <p className="mt-5 text-sm font-semibold text-emerald-700">
                You are enrolled.
              </p>
            ) : (
              <form action={enrollInCourse.bind(null, course.id)}>
                <button
                  className="mt-5 h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white"
                  type="submit">
                  Start course
                </button>
              </form>
            )
          ) : (
            <Link
              className="mt-5 inline-flex h-10 items-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white"
              href="/">
              Login to start
            </Link>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Curriculum</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {(lessons ?? []).map((lesson) => (
              <li className="flex items-center justify-between py-3" key={lesson.id}>
                <span className="text-sm font-medium">{lesson.title}</span>
                {enrollment ? (
                  <Link
                    className="text-sm font-semibold text-cyan-700"
                    href={`/courses/${course.id}/lessons/${lesson.id}`}>
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add course link to main page**

Modify `src/app/main/page.tsx` so authenticated users see a link to `/courses`.

- [ ] **Step 5: Build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/courses/page.tsx src/app/courses/[courseId]/page.tsx src/app/main/page.tsx
git commit -m "feat: add public course browsing"
```

---

## Task 5: Enrollment And Lesson Progress Actions

**Files:**
- Create: `src/app/courses/actions.ts`
- Create: `src/app/courses/[courseId]/lessons/[lessonId]/page.tsx`

**Interfaces:**
- Produces: `enrollInCourse(courseId: string): Promise<void>`
- Produces: `markLessonComplete(courseId: string, lessonId: string): Promise<void>`

- [ ] **Step 1: Create enrollment action**

Create `src/app/courses/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  await supabase.from('enrollments').upsert(
    {
      course_id: courseId,
      user_id: user.id,
    },
    { onConflict: 'user_id,course_id' },
  );

  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function markLessonComplete(courseId: string, lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  await supabase.from('lesson_progress').upsert(
    {
      lesson_id: lessonId,
      user_id: user.id,
    },
    { onConflict: 'user_id,lesson_id' },
  );

  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
}
```

- [ ] **Step 2: Create protected lesson viewer**

Create `src/app/courses/[courseId]/lessons/[lessonId]/page.tsx` that:

- redirects anonymous users to `/`
- loads user role from `profiles`
- loads enrollment for `courseId`
- allows access when role is `admin` or enrollment exists
- selects `title` from `lessons` and `content`, `video_url` from `lesson_contents`
- shows `Mark complete` form for enrolled users

- [ ] **Step 3: Build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/courses/actions.ts src/app/courses/[courseId]/lessons/[lessonId]/page.tsx
git commit -m "feat: add enrollment and lesson progress"
```

---

## Task 6: Admin Course CRUD

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/courses/new/page.tsx`
- Create: `src/app/admin/courses/actions.ts`

**Interfaces:**
- Consumes: `parseCourseForm(formData: FormData)`
- Consumes: `canManageCourses(role)`
- Produces: `createCourse(formData: FormData): Promise<void>`
- Produces: `deleteCourse(courseId: string): Promise<void>`

- [ ] **Step 1: Write failing tests for `parseCourseForm` if missing edge cases**

Add to `src/lib/courses/course-form.test.ts`:

```ts
it('normalizes unknown course status to draft', () => {
  const formData = new FormData();
  formData.set('title', 'React Basics');
  formData.set('status', 'archived');

  expect(parseCourseForm(formData)).toEqual({
    ok: true,
    value: {
      title: 'React Basics',
      description: '',
      status: 'draft',
    },
  });
});
```

- [ ] **Step 2: Run test to verify it passes or fails for the right reason**

Run:

```bash
pnpm test src/lib/courses/course-form.test.ts
```

Expected: PASS if Task 3 already normalizes status; otherwise FAIL, then update `readStatus`.

- [ ] **Step 3: Create admin guard pattern**

In each admin page/action:

```ts
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  redirect('/');
}

const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .maybeSingle();

if (!canManageCourses(profile?.role)) {
  redirect('/main');
}
```

- [ ] **Step 4: Create admin dashboard**

Create `src/app/admin/page.tsx` listing all courses with title, status,
enrollment count placeholder text, and links to create/edit.

- [ ] **Step 5: Create new course page**

Create `src/app/admin/courses/new/page.tsx` with a form posting to
`createCourse`.

- [ ] **Step 6: Create admin course actions**

Create `src/app/admin/courses/actions.ts` with:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { canManageCourses } from '@/lib/auth/access';
import { parseCourseForm } from '@/lib/courses/course-form';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!canManageCourses(profile?.role)) {
    redirect('/main');
  }

  return { supabase, user };
}

export async function createCourse(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const parsed = parseCourseForm(formData);

  if (!parsed.ok) {
    redirect('/admin/courses/new?error=invalid-course');
  }

  const { data } = await supabase
    .from('courses')
    .insert({
      title: parsed.value.title,
      description: parsed.value.description,
      status: parsed.value.status,
      created_by: user.id,
    })
    .select('id')
    .single();

  revalidatePath('/admin');
  redirect(data ? `/admin/courses/${data.id}/edit` : '/admin');
}

export async function deleteCourse(courseId: string) {
  const { supabase } = await requireAdmin();

  await supabase.from('courses').delete().eq('id', courseId);

  revalidatePath('/admin');
  redirect('/admin');
}
```

- [ ] **Step 7: Build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/admin src/lib/courses/course-form.test.ts src/lib/courses/course-form.ts
git commit -m "feat: add admin course management"
```

---

## Task 7: Admin Lesson CRUD

**Files:**
- Modify: `src/app/admin/courses/[courseId]/edit/page.tsx`
- Modify: `src/app/admin/courses/actions.ts`

**Interfaces:**
- Consumes: `parseLessonForm(formData: FormData)`
- Produces: `addLesson(courseId: string, formData: FormData): Promise<void>`
- Produces: `deleteLesson(courseId: string, lessonId: string): Promise<void>`

- [ ] **Step 1: Add lesson actions**

Add to `src/app/admin/courses/actions.ts`:

```ts
import { parseLessonForm } from '@/lib/courses/course-form';

export async function addLesson(courseId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseLessonForm(formData);

  if (!parsed.ok) {
    redirect(`/admin/courses/${courseId}/edit?error=invalid-lesson`);
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .insert({
    course_id: courseId,
    title: parsed.value.title,
    sort_order: parsed.value.sortOrder,
    })
    .select('id')
    .single();

  if (lesson) {
    await supabase.from('lesson_contents').insert({
      lesson_id: lesson.id,
      content: parsed.value.content,
      video_url: parsed.value.videoUrl,
    });
  }

  revalidatePath(`/admin/courses/${courseId}/edit`);
}

export async function deleteLesson(courseId: string, lessonId: string) {
  const { supabase } = await requireAdmin();

  await supabase.from('lessons').delete().eq('id', lessonId);

  revalidatePath(`/admin/courses/${courseId}/edit`);
}
```

- [ ] **Step 2: Create edit page**

Create `src/app/admin/courses/[courseId]/edit/page.tsx` that:

- requires admin
- loads the course by id
- loads lessons ordered by `sort_order`
- shows course fields for read-only MVP edit context
- includes an add lesson form
- includes delete lesson forms for each lesson

- [ ] **Step 3: Build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/courses/actions.ts src/app/admin/courses/[courseId]/edit/page.tsx
git commit -m "feat: add admin lesson management"
```

---

## Task 8: Final Verification And PRD Trace

**Files:**
- Modify: `memory-bank/2026-08-19-lms-free-mvp-prd.md` only if implementation reveals a necessary wording correction.

**Interfaces:**
- Consumes all prior tasks.
- Produces final verified MVP state.

- [ ] **Step 1: Run unit tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
.\node_modules\.bin\tsc.cmd --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: PRD trace**

Check the implementation against these PRD requirements:

- Email/password auth works with Supabase.
- `profiles.role` controls admin-only UI and routes.
- Admin can manage courses and lessons.
- User can browse only published courses.
- Anonymous visitors can browse published course listings and overview pages.
- User can enroll in a free course.
- User can view lessons only after enrollment.
- User can mark lessons complete.
- RLS policies prevent unauthorized reads and writes.

- [ ] **Step 5: Commit any final documentation correction**

If the PRD changed:

```bash
git add memory-bank/2026-08-19-lms-free-mvp-prd.md
git commit -m "docs: align LMS PRD with implementation"
```

If the PRD did not change, skip this step.
