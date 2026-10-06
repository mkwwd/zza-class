import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type R2UploadKind = 'thumbnail' | 'video';

type R2UploadPresetInput = {
  contentType: string;
  kind: R2UploadKind;
};

type R2ObjectKeyInput = {
  fileName: string;
  kind: R2UploadKind;
  objectId: string;
};

type R2PublicUrlInput = {
  objectKey: string;
  publicBaseUrl: string;
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

export function getR2UploadPreset({ contentType, kind }: R2UploadPresetInput) {
  if (kind === 'thumbnail') {
    if (!contentType.startsWith('image/')) {
      throw new Error('썸네일은 이미지 파일만 업로드할 수 있어요.');
    }

    return {
      directory: 'thumbnails',
      maxSizeBytes: 5 * 1024 * 1024,
    };
  }

  if (contentType !== 'video/mp4' && contentType !== 'video/webm') {
    throw new Error('영상은 mp4 또는 webm 파일만 업로드할 수 있어요.');
  }

  return {
    directory: 'videos',
    maxSizeBytes: 1024 * 1024 * 1024,
  };
}

export function buildR2ObjectKey({
  fileName,
  kind,
  objectId,
}: R2ObjectKeyInput) {
  const preset = kind === 'thumbnail' ? 'thumbnails' : 'videos';
  const extension = readExtension(fileName);
  const baseName = extension
    ? fileName.slice(0, -(extension.length + 1))
    : fileName;
  const safeName = slugify(baseName) || 'file';

  return `${preset}/${slugify(objectId) || objectId}-${safeName}${
    extension ? `.${extension}` : ''
  }`;
}

export function buildR2PublicUrl({
  objectKey,
  publicBaseUrl,
}: R2PublicUrlInput) {
  const baseUrl = publicBaseUrl.replace(/\/+$/, '');
  const cleanKey = objectKey.replace(/^\/+/, '');

  return `${baseUrl}/${cleanKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;
}

export function readR2Config(): R2Config | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ??
    process.env.R2_SECRET_ACCESS_KEY;
  const bucketName =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME;
  const publicBaseUrl =
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL ?? process.env.R2_PUBLIC_BASE_URL;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicBaseUrl
  ) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    bucketName,
    publicBaseUrl,
    secretAccessKey,
  };
}

function createR2Client({
  accessKeyId,
  accountId,
  secretAccessKey,
}: Pick<R2Config, 'accessKeyId' | 'accountId' | 'secretAccessKey'>) {
  return new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: 'auto',
  });
}

export async function createR2PutObjectUpload({
  contentType,
  fileName,
  kind,
  objectId,
  r2Config,
}: R2ObjectKeyInput & {
  contentType: string;
  r2Config: R2Config;
}) {
  const objectKey = buildR2ObjectKey({ fileName, kind, objectId });
  const client = createR2Client(r2Config);
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: r2Config.bucketName,
      ContentType: contentType,
      Key: objectKey,
    }),
    { expiresIn: 60 * 5 },
  );

  return {
    objectKey,
    publicUrl: buildR2PublicUrl({
      objectKey,
      publicBaseUrl: r2Config.publicBaseUrl,
    }),
    uploadUrl,
  };
}

function readExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

  return /^[a-z0-9]{1,8}$/.test(extension) &&
    extension !== fileName.toLowerCase()
    ? extension
    : '';
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
