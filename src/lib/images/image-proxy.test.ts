import { describe, expect, it } from 'vitest';

import { getImageProxyResponseHeaders } from './image-proxy';

describe('getImageProxyResponseHeaders', () => {
  it('keeps image metadata while preventing public caching and sniffing', () => {
    const headers = getImageProxyResponseHeaders(
      new Headers({
        'content-length': '2048',
        'content-type': 'image/webp',
        etag: 'poster-etag',
        'last-modified': 'Wed, 07 Oct 2026 10:00:00 GMT',
      }),
    );

    expect(Object.fromEntries(headers)).toEqual({
      'cache-control': 'private, no-store',
      'content-length': '2048',
      'content-type': 'image/webp',
      'cross-origin-resource-policy': 'same-origin',
      etag: 'poster-etag',
      'last-modified': 'Wed, 07 Oct 2026 10:00:00 GMT',
      'x-content-type-options': 'nosniff',
    });
  });
});
