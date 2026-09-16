import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // @serwist/next bundles the service worker via its webpack plugin.
  // Next.js 16 defaults to Turbopack; use `pnpm dev/build` (--webpack) until
  // migrating to @serwist/turbopack. See https://serwist.pages.dev/docs/next/turbo
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
