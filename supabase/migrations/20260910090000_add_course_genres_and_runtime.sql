create table if not exists public.genres (
  slug text primary key,
  label_ko text not null,
  label_en text not null,
  sort_order smallint not null unique
);

create table if not exists public.course_genres (
  course_id uuid not null references public.courses(id) on delete cascade,
  genre_slug text not null references public.genres(slug),
  position smallint not null check (position between 1 and 2),
  primary key (course_id, genre_slug),
  unique (course_id, position)
);

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

alter table public.lessons
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

update public.lessons as lesson
set has_video = exists (
  select 1
  from public.lesson_contents as content
  where content.lesson_id = lesson.id
    and nullif(trim(content.video_url), '') is not null
);

alter table public.genres enable row level security;
alter table public.course_genres enable row level security;

grant select on public.genres to anon, authenticated;
grant select on public.course_genres to anon, authenticated;
grant insert, update, delete on public.course_genres to authenticated;

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
    where requested.slug is null or genre.slug is null
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
