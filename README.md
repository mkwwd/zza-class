# ZZA Class

Next.js와 Supabase로 만드는 무료 수강 LMS MVP입니다.

## 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경 변수

`.env.example`을 기준으로 `.env.local`에 값을 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

## Cloudflare R2 설정

1. Cloudflare Dashboard에서 R2 bucket을 만듭니다.
2. R2 API Token에서 Object Read & Write 권한의 Access Key ID와 Secret Access Key를 발급합니다.
3. bucket의 Public Development URL을 켜거나 custom domain을 연결합니다.
4. public URL을 `CLOUDFLARE_R2_PUBLIC_BASE_URL`에 넣습니다.
5. 브라우저 업로드가 되도록 bucket CORS에 `GET`, `PUT`과 `Content-Type` 헤더를 허용합니다.

개발 중 CORS 예시:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

배포 후에는 `AllowedOrigins`에 실제 서비스 도메인도 추가합니다.
