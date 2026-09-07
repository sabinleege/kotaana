# File Storage

## Providers
| Mode | When | Path |
|------|------|------|
| **local** | No S3 env vars | `.data/uploads/` + `/api/storage/...` |
| **s3 / R2** | `S3_BUCKET` + keys set | AWS S3 or Cloudflare R2 |

## Env
```
S3_BUCKET=
S3_REGION=auto
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://cdn.example.com
LOCAL_UPLOAD_DIR=   # optional override
```

## API
- `POST /api/storage/upload` — multipart `file` + `folder` **or** JSON `{ dataUrl, folder, filename }`
- `GET /api/storage/:key` — serve local files

## Folders
`progress-photos` · `meals` · `avatars` · `injuries` · `misc`

## Production note
Install `@aws-sdk/client-s3` and replace the placeholder PutObject/DeleteObject/getSignedUrl in `src/lib/storage/s3.ts`.
