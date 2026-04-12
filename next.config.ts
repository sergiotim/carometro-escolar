import type { NextConfig } from "next";

const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

const remotePatterns = r2PublicBaseUrl
  ? (() => {
      try {
        const parsed = new URL(r2PublicBaseUrl);
        return [
          {
            protocol: parsed.protocol.replace(":", "") as "http" | "https",
            hostname: parsed.hostname,
          },
          {
            protocol: "https" as const,
            hostname: "**.r2.cloudflarestorage.com",
          },
        ];
      } catch {
        return [
          {
            protocol: "https" as const,
            hostname: "**.r2.cloudflarestorage.com",
          },
        ];
      }
    })()
  : [
      {
        protocol: "https" as const,
        hostname: "**.r2.cloudflarestorage.com",
      },
    ];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
