
import { S3Client } from '@aws-sdk/client-s3';

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

// Public URL prefix for accessing files, ensure this is correctly set in .env
// e.g., https://pub-youraccountid.r2.dev/your-bucket-name or your custom domain
export const R2_PUBLIC_URL_PREFIX = process.env.CLOUDFLARE_R2_PUBLIC_URL_PREFIX;


let r2ClientInstance: S3Client | null = null;

if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME) {
  try {
    r2ClientInstance = new S3Client({
      region: 'auto', // R2 specific
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  } catch (error) {
    console.error("Failed to initialize Cloudflare R2 client:", error);
    r2ClientInstance = null;
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'Cloudflare R2 environment variables are not fully configured. File uploads to R2 will be disabled.' +
      ' Missing: ' +
      [!R2_ENDPOINT ? 'CLOUDFLARE_R2_ENDPOINT ' : ''].join('') +
      [!R2_ACCESS_KEY_ID ? 'CLOUDFLARE_R2_ACCESS_KEY_ID ' : ''].join('') +
      [!R2_SECRET_ACCESS_KEY ? 'CLOUDFLARE_R2_SECRET_ACCESS_KEY ' : ''].join('') +
      [!R2_BUCKET_NAME ? 'CLOUDFLARE_R2_BUCKET_NAME' : ''].join('')
    );
  }
}

export const r2Client = r2ClientInstance;

if (process.env.NODE_ENV === 'development' && !R2_PUBLIC_URL_PREFIX && R2_BUCKET_NAME) {
  console.warn(
    `CLOUDFLARE_R2_PUBLIC_URL_PREFIX is not set in .env. ` +
    `This is crucial for accessing uploaded files. ` +
    `It should be the base public URL for your bucket, e.g., https://pub-youraccountid.r2.dev/${R2_BUCKET_NAME}`
  );
}
