alter table public.courses
  add column if not exists preview_video_object_key text;

alter table public.lesson_contents
  add column if not exists video_object_key text;

create table if not exists public.lesson_rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  rental_kind text not null default 'paid'
    check (rental_kind in ('paid', 'legacy')),
  rented_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

insert into public.lesson_rentals (user_id, lesson_id, rental_kind, rented_at)
select enrollment.user_id, lesson.id, 'legacy', enrollment.created_at
from public.enrollments as enrollment
join public.lessons as lesson on lesson.course_id = enrollment.course_id
where lesson.sort_order > 1
on conflict (user_id, lesson_id) do nothing;

alter table public.lesson_rentals enable row level security;

grant select on public.lesson_rentals to authenticated;
grant select on public.lesson_contents to anon;

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

drop policy if exists "Enrolled users can view lesson contents" on public.lesson_contents;
drop policy if exists "Viewers can access available lesson contents" on public.lesson_contents;

create policy "Viewers can access available lesson contents"
on public.lesson_contents
for select
to anon, authenticated
using (public.can_view_lesson(lesson_id));

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

drop policy if exists "Users can enroll themselves" on public.enrollments;

drop policy if exists "Users can insert own lesson progress" on public.lesson_progress;

create policy "Users can insert own lesson progress"
on public.lesson_progress
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and public.can_view_lesson(lesson_id)
);

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
