import { copyFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const appDir = join(root, "src/app");

const TERRACOTTA = "#E07A5F";
const CORAL = "#F4A261";
const CREAM = "#FAF7F2";
const SAGE = "#7A9E7E";

function iconSvg(size, { maskable = false } = {}) {
  const padding = maskable ? size * 0.2 : size * 0.12;
  const inner = size - padding * 2;
  const scale = inner / 100;
  const offset = padding;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${TERRACOTTA}" />
      <stop offset="100%" stop-color="${CORAL}" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.22}" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <path d="M50 14 L86 48 L14 48 Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round" />
    <path d="M22 52 Q50 88 78 52" stroke="white" stroke-width="7" stroke-linecap="round" fill="none" />
    <circle cx="36" cy="58" r="5" fill="${SAGE}" />
    <circle cx="50" cy="62" r="5" fill="${SAGE}" />
    <circle cx="64" cy="58" r="5" fill="${SAGE}" />
  </g>
</svg>`;
}

function faviconSvg(size) {
  const scale = (size * 0.72) / 100;
  const offset = size * 0.14;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${CREAM}" rx="${size * 0.2}" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <path d="M50 14 L86 48 L14 48 Z" fill="${TERRACOTTA}" stroke="${TERRACOTTA}" stroke-width="2" stroke-linejoin="round" />
    <path d="M22 52 Q50 88 78 52" stroke="${TERRACOTTA}" stroke-width="7" stroke-linecap="round" fill="none" />
    <circle cx="36" cy="58" r="5" fill="${SAGE}" />
    <circle cx="50" cy="62" r="5" fill="${SAGE}" />
    <circle cx="64" cy="58" r="5" fill="${SAGE}" />
  </g>
</svg>`;
}

async function renderSvg(svg, outputPath, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outputPath);
  console.log(`Generated ${outputPath}`);
}

async function main() {
  await renderSvg(iconSvg(512), join(publicDir, "icons/icon-512.png"), 512);
  await renderSvg(iconSvg(192), join(publicDir, "icons/icon-192.png"), 192);
  await renderSvg(iconSvg(512, { maskable: true }), join(publicDir, "icons/icon-maskable-512.png"), 512);
  await renderSvg(iconSvg(180), join(publicDir, "apple-touch-icon.png"), 180);

  const favicon32 = faviconSvg(32);
  const favicon16 = faviconSvg(16);
  const favicon32Buf = await sharp(Buffer.from(favicon32)).resize(32, 32).png().toBuffer();
  const favicon16Buf = await sharp(Buffer.from(favicon16)).resize(16, 16).png().toBuffer();

  writeFileSync(join(publicDir, "favicon.png"), favicon32Buf);
  console.log("Generated public/favicon.png");

  const { default: toIco } = await import("to-ico");
  const faviconIco = await toIco([favicon16Buf, favicon32Buf]);
  writeFileSync(join(publicDir, "favicon.ico"), faviconIco);
  console.log("Generated public/favicon.ico");

  copyFileSync(join(publicDir, "favicon.ico"), join(appDir, "favicon.ico"));
  writeFileSync(join(appDir, "icon.png"), favicon32Buf);
  copyFileSync(join(publicDir, "apple-touch-icon.png"), join(appDir, "apple-icon.png"));
  console.log("Generated src/app/favicon.ico, src/app/icon.png, and src/app/apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
