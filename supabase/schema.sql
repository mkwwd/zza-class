do $$
begin
  create type public.app_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.course_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.course_status not null default 'draft',
  thumbnail_url text,
  thumbnail_image_id text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  thumbnail_url text,
  thumbnail_image_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_contents (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  content text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.courses
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_image_id text;

alter table public.lessons
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_image_id text;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_contents enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;

grant select on public.courses to anon, authenticated;
grant insert, update, delete on public.courses to authenticated;

grant select on public.lessons to anon, authenticated;
grant insert, update, delete on public.lessons to authenticated;

grant select, insert, update, delete on public.lesson_contents to authenticated;

grant select, insert on public.enrollments to authenticated;

grant select, insert, update on public.lesson_progress to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = is_admin.user_id and role = 'admin'
  );
$$;

create or replace function public.is_enrolled(
  user_id uuid,
  target_course_id uuid
)
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
      and enrollments.course_id = is_enrolled.target_course_id
  );
$$;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin((select auth.uid())));

drop policy if exists "Anyone can view published courses" on public.courses;
drop policy if exists "Admins can view all courses" on public.courses;
drop policy if exists "Admins can create courses" on public.courses;
drop policy if exists "Admins can update courses" on public.courses;
drop policy if exists "Admins can delete courses" on public.courses;

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

drop policy if exists "Anyone can view published lesson metadata" on public.lessons;
drop policy if exists "Admins can manage lessons" on public.lessons;

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

drop policy if exists "Enrolled users can view lesson contents" on public.lesson_contents;
drop policy if exists "Admins can manage lesson contents" on public.lesson_contents;

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

drop policy if exists "Users can view own enrollments" on public.enrollments;
drop policy if exists "Users can enroll themselves" on public.enrollments;
drop policy if exists "Admins can view all enrollments" on public.enrollments;

create policy "Users can view own enrollments"
on public.enrollments
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can enroll themselves"
on public.enrollments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.courses
    where courses.id = enrollments.course_id
      and courses.status = 'published'
  )
);

create policy "Admins can view all enrollments"
on public.enrollments
for select
to authenticated
using (public.is_admin((select auth.uid())));

drop policy if exists "Users can view own lesson progress" on public.lesson_progress;
drop policy if exists "Users can insert own lesson progress" on public.lesson_progress;
drop policy if exists "Users can update own lesson progress" on public.lesson_progress;
drop policy if exists "Admins can view all lesson progress" on public.lesson_progress;

create policy "Users can view own lesson progress"
on public.lesson_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own lesson progress"
on public.lesson_progress
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.lessons
    where lessons.id = lesson_progress.lesson_id
      and public.is_enrolled((select auth.uid()), lessons.course_id)
  )
);

create policy "Users can update own lesson progress"
on public.lesson_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Admins can view all lesson progress"
on public.lesson_progress
for select
to authenticated
using (public.is_admin((select auth.uid())));

-- Run this manually after the user signs up to promote an account:
-- update public.profiles set role = 'admin' where email = 'admin@example.com';

-- Run this manually if users signed up before the trigger existed:
-- insert into public.profiles (id, email)
-- select id, email
-- from auth.users
-- on conflict (id) do update set email = excluded.email, updated_at = now();
