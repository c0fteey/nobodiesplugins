import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      new URL("https://picsum.photos/**"),
      new URL("https://fastly.picsum.photos/**"),
      // Uploaded media (Neon Object Storage, "media" bucket) and Discord avatars
      ...(process.env.AWS_ENDPOINT_URL_S3 ? [new URL(`${process.env.AWS_ENDPOINT_URL_S3}/media/**`)] : []),
      new URL("https://cdn.discordapp.com/**"),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
