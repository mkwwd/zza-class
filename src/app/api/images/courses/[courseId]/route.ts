import { getPrivateR2ObjectUrl } from '@/lib/cloudflare/r2';
import { proxyImageRequest } from '@/lib/images/image-proxy';
import { createClient } from '@/lib/supabase/server';

type CourseImageRouteProps = {
  params: Promise<{ courseId: string }>;
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: CourseImageRouteProps) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from('courses')
    .select('thumbnail_image_id')
    .eq('id', courseId)
    .maybeSingle();

  if (error || !course?.thumbnail_image_id) {
    return new Response(null, { status: 404 });
  }

  const sourceUrl = await getPrivateR2ObjectUrl(
    course.thumbnail_image_id,
    'thumbnail',
  );

  return sourceUrl
    ? proxyImageRequest(sourceUrl)
    : new Response(null, { status: 404 });
}
