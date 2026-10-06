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

create table if not exists public.genres (
  slug text primary key
    constraint genres_slug_fixed_catalog
    check (slug in ('drama', 'romance', 'thriller', 'fantasy', 'animation')),
  label_ko text not null,
  label_en text not null,
  sort_order smallint not null unique
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'genres_slug_fixed_catalog'
      and conrelid = 'public.genres'::regclass
  ) then
    alter table public.genres
      add constraint genres_slug_fixed_catalog
      check (slug in ('drama', 'romance', 'thriller', 'fantasy', 'animation'));
  end if;
end $$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  staff_note text,
  status public.course_status not null default 'draft',
  thumbnail_url text,
  thumbnail_image_id text,
  preview_video_object_key text,
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
  duration_seconds integer
    constraint lessons_duration_seconds_non_negative
    check (duration_seconds is null or duration_seconds >= 0),
  has_video boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_genres (
  course_id uuid not null references public.courses(id) on delete cascade,
  genre_slug text not null references public.genres(slug),
  position smallint not null check (position between 1 and 2),
  primary key (course_id, genre_slug),
  unique (course_id, position)
);

create table if not exists public.lesson_contents (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  content text,
  video_url text,
  video_object_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  rental_kind text not null default 'paid'
    check (rental_kind in ('paid', 'legacy')),
  rented_at timestamptz not null default now(),
  unique (user_id, lesson_id)
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
  add column if not exists thumbnail_image_id text,
  add column if not exists staff_note text,
  add column if not exists preview_video_object_key text;

alter table public.lesson_contents
  add column if not exists video_object_key text;

alter table public.lessons
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_image_id text,
  add column if not exists duration_seconds integer,
  add column if not exists has_video boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lessons_duration_seconds_non_negative'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_duration_seconds_non_negative
      check (duration_seconds is null or duration_seconds >= 0);
  end if;
end $$;

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

update public.lessons as lesson
set has_video = exists (
  select 1
  from public.lesson_contents as content
  where content.lesson_id = lesson.id
    and (
      nullif(trim(content.video_object_key), '') is not null
      or nullif(trim(content.video_url), '') is not null
    )
);

insert into public.lesson_rentals (user_id, lesson_id, rental_kind, rented_at)
select enrollment.user_id, lesson.id, 'legacy', enrollment.created_at
from public.enrollments as enrollment
join public.lessons as lesson on lesson.course_id = enrollment.course_id
where lesson.sort_order > 1
on conflict (user_id, lesson_id) do nothing;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_contents enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_rentals enable row level security;
alter table public.genres enable row level security;
alter table public.course_genres enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;

grant select on public.courses to anon, authenticated;
grant insert, update, delete on public.courses to authenticated;

grant select on public.lessons to anon, authenticated;
grant insert, update, delete on public.lessons to authenticated;

grant select on public.lesson_contents to anon;
grant select, insert, update, delete on public.lesson_contents to authenticated;

grant select, insert on public.enrollments to authenticated;

grant select, insert, update on public.lesson_progress to authenticated;
grant select on public.lesson_rentals to authenticated;

grant select on public.genres to anon, authenticated;
grant select on public.course_genres to anon, authenticated;
grant insert, update, delete on public.course_genres to authenticated;

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

create or replace function public.can_view_lesson(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons
    join public.courses on courses.id = lessons.course_id
    where lessons.id = target_lesson_id
      and courses.status = 'published'
      and lessons.sort_order = 1
  ) or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ) or exists (
    select 1
    from public.lesson_rentals
    where lesson_rentals.user_id = (select auth.uid())
      and lesson_rentals.lesson_id = target_lesson_id
  );
$$;

revoke all on function public.can_view_lesson(uuid) from public;
grant execute on function public.can_view_lesson(uuid) to anon, authenticated;

create or replace function public.replace_course_genres(
  target_course_id uuid,
  selected_genre_slugs text[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  normalized_genre_slugs text[];
begin
  select coalesce(
    array_agg(selection.genre_slug order by selection.first_position),
    array[]::text[]
  )
  into normalized_genre_slugs
  from (
    select input.genre_slug, min(input.position) as first_position
    from unnest(coalesce(selected_genre_slugs, array[]::text[]))
      with ordinality as input(genre_slug, position)
    group by input.genre_slug
  ) as selection;

  if cardinality(normalized_genre_slugs) > 2 then
    raise exception using
      errcode = '22023',
      message = 'A course can have no more than two genres.';
  end if;

  if exists (
    select 1
    from unnest(normalized_genre_slugs) as requested(slug)
    left join public.genres as genre on genre.slug = requested.slug
    where requested.slug is null
      or requested.slug not in (
        'drama',
        'romance',
        'thriller',
        'fantasy',
        'animation'
      )
      or genre.slug is null
  ) then
    raise exception using
      errcode = '22023',
      message = 'One or more course genres are invalid.';
  end if;

  delete from public.course_genres
  where course_id = target_course_id;

  insert into public.course_genres (course_id, genre_slug, position)
  select
    target_course_id,
    selection.genre_slug,
    selection.position::smallint
  from unnest(normalized_genre_slugs)
    with ordinality as selection(genre_slug, position);
end;
$$;

revoke execute on function public.replace_course_genres(uuid, text[]) from public;
grant execute on function public.replace_course_genres(uuid, text[]) to authenticated;

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

drop policy if exists "Anyone can view genres" on public.genres;
drop policy if exists "Anyone can view course genres" on public.course_genres;
drop policy if exists "Admins can manage course genres" on public.course_genres;

create policy "Anyone can view genres"
on public.genres
for select
to anon, authenticated
using (true);

create policy "Anyone can view course genres"
on public.course_genres
for select
to anon, authenticated
using (true);

create policy "Admins can manage course genres"
on public.course_genres
for all
to authenticated
using (public.is_admin((select auth.uid())))
with check (public.is_admin((select auth.uid())));

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
drop policy if exists "Viewers can access available lesson contents" on public.lesson_contents;
drop policy if exists "Admins can manage lesson contents" on public.lesson_contents;

create policy "Viewers can access available lesson contents"
on public.lesson_contents
for select
to anon, authenticated
using (public.can_view_lesson(lesson_id));

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

create policy "Admins can view all enrollments"
on public.enrollments
for select
to authenticated
using (public.is_admin((select auth.uid())));

drop policy if exists "Users can view own lesson rentals" on public.lesson_rentals;
drop policy if exists "Admins can view all lesson rentals" on public.lesson_rentals;

create policy "Users can view own lesson rentals"
on public.lesson_rentals
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can view all lesson rentals"
on public.lesson_rentals
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
  and public.can_view_lesson(lesson_id)
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
