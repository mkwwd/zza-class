import { getPrivateVideoPlaybackUrl } from '@/lib/cloudflare/r2';
import { createClient } from '@/lib/supabase/server';
import {
  getTrustedLegacyVideoUrl,
  isDirectVideoNavigation,
  proxyVideoRequest,
} from '@/lib/videos/playback-proxy';

type LessonVideoRouteProps = {
  params: Promise<{ lessonId: string }>;
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, { params }: LessonVideoRouteProps) {
  if (isDirectVideoNavigation(request.headers.get('sec-fetch-dest'))) {
    return new Response(null, { status: 404 });
  }

  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: content, error } = await supabase
    .from('lesson_contents')
    .select('video_object_key, video_url')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error || !content) return new Response(null, { status: 404 });

  const sourceUrl = content.video_object_key
    ? await getPrivateVideoPlaybackUrl(content.video_object_key)
    : getTrustedLegacyVideoUrl(
        content.video_url,
        process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL ??
          process.env.R2_PUBLIC_BASE_URL,
      );

  if (!sourceUrl) return new Response(null, { status: 404 });

  return proxyVideoRequest(request, sourceUrl);
}
