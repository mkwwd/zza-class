const VIDEO_RESPONSE_HEADERS = [
  'accept-ranges',
  'content-length',
  'content-range',
  'content-type',
  'etag',
] as const;

export function buildLessonPlaybackPath(lessonId: string) {
  return `/api/videos/lessons/${encodeURIComponent(lessonId)}`;
}

export function buildPreviewPlaybackPath(courseId: string) {
  return `/api/videos/courses/${encodeURIComponent(courseId)}/preview`;
}

export function isDirectVideoNavigation(fetchDestination: string | null) {
  return fetchDestination === 'document';
}

export function getTrustedLegacyVideoUrl(
  videoUrl: string | null,
  publicBaseUrl: string | undefined,
) {
  if (!videoUrl || !publicBaseUrl) return null;

  try {
    const source = new URL(videoUrl);
    const publicBase = new URL(publicBaseUrl);
    const basePath = `${publicBase.pathname.replace(/\/+$/, '')}/`;

    return source.origin === publicBase.origin &&
      source.pathname.startsWith(basePath)
      ? source.toString()
      : null;
  } catch {
    return null;
  }
}

export function getVideoProxyResponseHeaders(upstreamHeaders: Headers) {
  const headers = new Headers({
    'cache-control': 'private, no-store',
    'cross-origin-resource-policy': 'same-origin',
    'x-content-type-options': 'nosniff',
  });

  for (const name of VIDEO_RESPONSE_HEADERS) {
    const value = upstreamHeaders.get(name);
    if (value) headers.set(name, value);
  }

  return headers;
}

export async function proxyVideoRequest(request: Request, sourceUrl: string) {
  const range = request.headers.get('range');
  const upstream = await fetch(sourceUrl, {
    cache: 'no-store',
    headers: range ? { range } : undefined,
  });

  return new Response(upstream.body, {
    headers: getVideoProxyResponseHeaders(upstream.headers),
    status: upstream.status,
  });
}
