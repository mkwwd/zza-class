type EpisodeIdentifier = {
  id: string;
};

type MyBagTitle = {
  id: string;
  lessonIds: string[];
};

export function partitionMyBagTitles<T extends MyBagTitle>(
  titles: T[],
  completedLessonIds: ReadonlySet<string>,
) {
  const rented: T[] = [];
  const completed: T[] = [];

  for (const title of titles) {
    const isCompleted =
      title.lessonIds.length > 0 &&
      title.lessonIds.every((lessonId) => completedLessonIds.has(lessonId));

    (isCompleted ? completed : rented).push(title);
  }

  return { rented, completed };
}

export function getEpisodeNavigation(
  episodes: EpisodeIdentifier[],
  lessonId: string,
) {
  const activeIndex = episodes.findIndex((episode) => episode.id === lessonId);

  if (activeIndex < 0) {
    return { previousId: null, nextId: null };
  }

  return {
    previousId: episodes[activeIndex - 1]?.id ?? null,
    nextId: episodes[activeIndex + 1]?.id ?? null,
  };
}
