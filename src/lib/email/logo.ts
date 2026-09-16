import "server-only";

import fs from "node:fs";
import path from "node:path";

/** Content-ID referenciado en el HTML del correo: `<img src="cid:nido-logo@nido" />` */
export const EMAIL_LOGO_CID = "nido-logo@nido";

let cachedLogo: Buffer | null = null;

function getLogoPath(): string {
  return path.join(process.cwd(), "src/lib/email/assets/logo-email.png");
}

function getEmailLogoBuffer(): Buffer {
  if (!cachedLogo) {
    cachedLogo = fs.readFileSync(getLogoPath());
  }
  return cachedLogo;
}

export function getEmailLogoAttachment() {
  return {
    FileName: "logo-email.png",
    ContentType: "image/png",
    ContentDisposition: "INLINE" as const,
    ContentId: EMAIL_LOGO_CID,
    RawContent: new Uint8Array(getEmailLogoBuffer()),
  };
}
