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

type GenreParseResult =
  { ok: true; value: GenreSlug[] } | { ok: false; error: string };

const genreSlugSet = new Set<string>(GENRE_SLUGS);

export function parseGenreSlugs(
  values: FormDataEntryValue[],
): GenreParseResult {
  const genreSlugs: GenreSlug[] = [];

  for (const value of values) {
    if (typeof value !== 'string' || !genreSlugSet.has(value)) {
      return { ok: false, error: 'Invalid course genres.' };
    }

    const genreSlug = value as GenreSlug;

    if (!genreSlugs.includes(genreSlug)) {
      genreSlugs.push(genreSlug);
    }
  }

  if (genreSlugs.length > 2) {
    return { ok: false, error: 'Select no more than two course genres.' };
  }

  return { ok: true, value: genreSlugs };
}

export function toggleGenreSelection(
  selected: GenreSlug[],
  slug: GenreSlug,
): GenreSlug[] {
  if (selected.includes(slug)) {
    return selected.filter((selectedSlug) => selectedSlug !== slug);
  }

  if (selected.length >= 2) {
    return selected;
  }

  return [...selected, slug];
}

export function formatGenreLabels(labels: string[]): string {
  return labels.length > 0 ? labels.join(' · ') : '장르 미등록';
}
