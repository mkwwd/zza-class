'use client';

import { useId, useState } from 'react';

import {
  toggleGenreSelection,
  type GenreOption,
  type GenreSlug,
} from '@/lib/courses/genres';

import styles from '../admin-video-room.module.css';

type GenreSelectorProps = {
  initialSelected?: GenreSlug[];
  options: GenreOption[];
};

export function GenreSelector({
  initialSelected = [],
  options,
}: GenreSelectorProps) {
  const hintId = useId();
  const [selected, setSelected] = useState<GenreSlug[]>(initialSelected);

  return (
    <fieldset aria-describedby={hintId} className={styles.genreSelector}>
      <legend>장르</legend>
      <div className={styles.genreSelectorHeader}>
        <p id={hintId}>최대 2개 선택 · 선택한 순서대로 표시됩니다.</p>
        <span aria-live="polite">{selected.length}/2</span>
      </div>
      <div className={styles.genreOptions}>
        {options.map((option) => {
          const isSelected = selected.includes(option.slug);
          const isDisabled = selected.length >= 2 && !isSelected;

          return (
            <button
              aria-pressed={isSelected}
              className={styles.genreOption}
              disabled={isDisabled}
              key={option.slug}
              onClick={() => {
                setSelected((current) =>
                  toggleGenreSelection(current, option.slug),
                );
              }}
              type="button">
              <span>{option.labelKo}</span>
              <small>{option.labelEn}</small>
            </button>
          );
        })}
      </div>
      {selected.map((slug) => (
        <input key={slug} name="genres" type="hidden" value={slug} />
      ))}
    </fieldset>
  );
}
