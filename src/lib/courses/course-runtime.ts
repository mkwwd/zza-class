export function sumPlayableRuntimeSeconds(
  durations: Array<number | null>,
): number | null {
  if (
    durations.length === 0 ||
    durations.some((duration) => duration === null)
  ) {
    return null;
  }

  return durations.reduce<number>(
    (total, duration) => total + (duration ?? 0),
    0,
  );
}

export function formatRuntimeLabel(durationSeconds: number | null): string {
  if (durationSeconds === null) {
    return '시간 미등록';
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }

  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }

  return `${seconds}초`;
}
