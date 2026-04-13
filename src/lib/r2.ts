import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const signedUrlExpiresIn = 3600;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getR2Client(): S3Client {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getR2BucketName(): string {
  return getRequiredEnv("R2_BUCKET_NAME");
}

export function getStudentImageKey(registration: string): string {
  return `${registration}.jpg`;
}

export function getPublicImageUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return null;

  try {
    const parsed = new URL(base);
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}/${key}`;
  } catch {
    return null;
  }
}

export async function getSignedGetImageUrl(key: string): Promise<string> {
  const client = getR2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
    { expiresIn: signedUrlExpiresIn },
  );
}

export async function getSignedPutImageUrl(key: string): Promise<string> {
  const client = getR2Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      ContentType: "image/jpeg",
    }),
    { expiresIn: signedUrlExpiresIn },
  );
}

export async function uploadStudentImage(
  registration: string,
  imageBuffer: Uint8Array,
): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: getStudentImageKey(registration),
      ContentType: "image/jpeg",
      Body: imageBuffer,
    }),
  );
}

export async function resolveStudentImageUrl(
  registration: string,
): Promise<string | null> {
  const key = getStudentImageKey(registration);
  const publicUrl = getPublicImageUrl(key);

  if (publicUrl) {
    return publicUrl;
  }

  try {
    return await getSignedGetImageUrl(key);
  } catch {
    return null;
  }
}
