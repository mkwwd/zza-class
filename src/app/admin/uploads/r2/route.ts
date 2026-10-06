import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/server';
import {
  createR2PutObjectUpload,
  getR2UploadPreset,
  readR2Config,
  type R2UploadKind,
} from '@/lib/cloudflare/r2';

type UploadRequestBody = {
  contentType?: string;
  fileName?: string;
  kind?: R2UploadKind;
  size?: number;
};

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await requireAdmin();

  const body = (await request.json()) as UploadRequestBody;
  const kind = body.kind;
  const contentType = body.contentType?.trim() ?? '';
  const fileName = body.fileName?.trim() ?? '';
  const size = body.size ?? 0;

  if (
    !kind ||
    (kind !== 'thumbnail' && kind !== 'video' && kind !== 'preview') ||
    !fileName
  ) {
    return NextResponse.json(
      { error: '업로드할 파일 정보를 확인해 주세요.' },
      { status: 400 },
    );
  }

  const r2Config = readR2Config(kind);

  if (!r2Config) {
    return NextResponse.json(
      {
        error:
          kind === 'thumbnail'
            ? 'Cloudflare R2 공개 버킷 환경 변수를 설정해 주세요.'
            : 'Cloudflare R2 비공개 영상 버킷 환경 변수를 설정해 주세요.',
      },
      { status: 503 },
    );
  }

  try {
    const preset = getR2UploadPreset({ contentType, kind });

    if (size > preset.maxSizeBytes) {
      return NextResponse.json(
        { error: '업로드 가능한 파일 크기를 초과했어요.' },
        { status: 413 },
      );
    }

    const upload = await createR2PutObjectUpload({
      contentType,
      fileName,
      kind,
      objectId: crypto.randomUUID(),
      r2Config,
    });

    return NextResponse.json(upload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '업로드 URL을 만들지 못했어요.',
      },
      { status: 400 },
    );
  }
}
