const IMAGE_RESPONSE_HEADERS = [
  'content-length',
  'content-type',
  'etag',
  'last-modified',
] as const;

export function getImageProxyResponseHeaders(upstreamHeaders: Headers) {
  const headers = new Headers({
    'cache-control': 'private, no-store',
    'cross-origin-resource-policy': 'same-origin',
    'x-content-type-options': 'nosniff',
  });

  for (const name of IMAGE_RESPONSE_HEADERS) {
    const value = upstreamHeaders.get(name);
    if (value) headers.set(name, value);
  }

  return headers;
}

export async function proxyImageRequest(sourceUrl: string) {
  const upstream = await fetch(sourceUrl, { cache: 'no-store' });

  return new Response(upstream.body, {
    headers: getImageProxyResponseHeaders(upstream.headers),
    status: upstream.status,
  });
}
