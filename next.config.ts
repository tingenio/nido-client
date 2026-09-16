import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // @serwist/next bundles the service worker via its webpack plugin.
  // Next.js 16 defaults to Turbopack; use `pnpm dev/build` (--webpack) until
  // migrating to @serwist/turbopack. See https://serwist.pages.dev/docs/next/turbo

  // Recomendado por Firebase para el Admin SDK en Next.js: evita que
  // webpack intente procesar sus módulos nativos/condicionales. El
  // ERR_REQUIRE_ESM real (jwks-rsa -> jose@6, ESM-only) se resuelve fijando
  // `jose` a la v4 en pnpm-workspace.yaml (overrides), no aquí.
  serverExternalPackages: ["firebase-admin"],

  // Logo embebido en correos: incluir el PNG en el bundle serverless de Vercel.
  outputFileTracingIncludes: {
    "/**/*": ["./src/lib/email/assets/logo-email.png"],
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
