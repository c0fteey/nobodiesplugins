import { config } from "dotenv";
config({ path: ".env.local" });

import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

// Sites that may upload straight to the "media" bucket from the browser
const ORIGINS = ["http://localhost:3000", "https://nobodiesplugins.vercel.app"];

// Usage: npm run storage:cors [-- https://extra-domain.com ...]
async function main() {
  const origins = [...ORIGINS, ...process.argv.slice(2)];
  const s3 = new S3Client({ forcePathStyle: true });

  await s3.send(
    new PutBucketCorsCommand({
      Bucket: "media",
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["GET", "PUT", "POST"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );

  const current = await s3.send(new GetBucketCorsCommand({ Bucket: "media" }));
  console.log("CORS origins:", current.CORSRules?.flatMap((r) => r.AllowedOrigins ?? []).join(", "));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
