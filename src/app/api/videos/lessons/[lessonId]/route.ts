import { canViewLessonContent } from '@/lib/auth/access';
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, sort_order')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonError || !lesson) return new Response(null, { status: 404 });

  const { data: rental } =
    user && lesson.sort_order > 1
      ? await supabase
          .from('lesson_rentals')
          .select('id')
          .eq('lesson_id', lesson.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : { data: null };

  if (
    !canViewLessonContent({
      isRented: Boolean(rental),
      sortOrder: lesson.sort_order,
    })
  ) {
    return new Response(null, { status: 404 });
  }

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
