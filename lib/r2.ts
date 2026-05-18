import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { optionalEnv, requireEnv } from "./env";

export function hasR2Config(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE_URL
  );
}

export async function uploadPublicObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const bucket = requireEnv("R2_BUCKET");
  const baseUrl = requireEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY")
    }
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );

  return `${baseUrl}/${key}`;
}

export async function readPublicObject(key: string): Promise<Buffer | undefined> {
  if (!hasR2Config()) return undefined;

  const accountId = requireEnv("R2_ACCOUNT_ID");
  const bucket = requireEnv("R2_BUCKET");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY")
    }
  });

  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    if (!result.Body) return undefined;

    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch {
    return undefined;
  }
}

export function publicObjectKey(jobId: string, filename: string): string {
  const prefix = optionalEnv("R2_PREFIX", "ugclabs-mvp").replace(/^\/|\/$/g, "");
  return `${prefix}/${jobId}/${filename}`;
}

export function publicGlobalObjectKey(filename: string): string {
  const prefix = optionalEnv("R2_PREFIX", "ugclabs-mvp").replace(/^\/|\/$/g, "");
  return `${prefix}/${filename}`;
}
