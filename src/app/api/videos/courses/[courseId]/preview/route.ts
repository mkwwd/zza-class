import { getPrivateVideoPlaybackUrl } from '@/lib/cloudflare/r2';
import { createClient } from '@/lib/supabase/server';
import {
  isDirectVideoNavigation,
  proxyVideoRequest,
} from '@/lib/videos/playback-proxy';

type PreviewVideoRouteProps = {
  params: Promise<{ courseId: string }>;
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: PreviewVideoRouteProps,
) {
  if (isDirectVideoNavigation(request.headers.get('sec-fetch-dest'))) {
    return new Response(null, { status: 404 });
  }

  const { courseId } = await params;
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from('courses')
    .select('preview_video_object_key')
    .eq('id', courseId)
    .maybeSingle();

  if (error || !course?.preview_video_object_key) {
    return new Response(null, { status: 404 });
  }

  const sourceUrl = await getPrivateVideoPlaybackUrl(
    course.preview_video_object_key,
  );

  return sourceUrl
    ? proxyVideoRequest(request, sourceUrl)
    : new Response(null, { status: 404 });
}
