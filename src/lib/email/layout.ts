import "server-only";

import { EMAIL_LOGO_CID } from "./logo";

/** Colores de marca Nido para correos (hex, compatibles con clientes de email). */
export const EMAIL_COLORS = {
  background: "#FAF9F7",
  card: "#FFFFFF",
  foreground: "#2D2926",
  muted: "#71717A",
  border: "#E4E4E7",
  primary: "#E07A5F",
  sage: "#7A9E7E",
  amber: "#D97706",
  amberBg: "#FEF3C7",
  sageBg: "#ECFDF3",
  red: "#DC2626",
  redBg: "#FEF2F2",
  primaryBg: "#FDF4F2",
} as const;

export type EmailAccent = "primary" | "amber" | "sage" | "red";

const ACCENT_STYLES: Record<EmailAccent, { badgeBg: string; badgeColor: string; buttonBg: string }> = {
  primary: { badgeBg: EMAIL_COLORS.primaryBg, badgeColor: EMAIL_COLORS.primary, buttonBg: EMAIL_COLORS.primary },
  amber: { badgeBg: EMAIL_COLORS.amberBg, badgeColor: EMAIL_COLORS.amber, buttonBg: EMAIL_COLORS.amber },
  sage: { badgeBg: EMAIL_COLORS.sageBg, badgeColor: EMAIL_COLORS.sage, buttonBg: EMAIL_COLORS.sage },
  red: { badgeBg: EMAIL_COLORS.redBg, badgeColor: EMAIL_COLORS.red, buttonBg: EMAIL_COLORS.red },
};

/** URL base de la app para CTAs. Requiere NEXT_PUBLIC_APP_URL en producción. */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailLogo(): string {
  return `<img src="cid:${EMAIL_LOGO_CID}" alt="Nido" width="120" height="29" style="display:block;border:0;outline:none;" />`;
}

export function emailBadge(label: string, accent: EmailAccent): string {
  const { badgeBg, badgeColor } = ACCENT_STYLES[accent];
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${badgeBg};color:${badgeColor};font-size:12px;font-weight:600;line-height:1.4;">${escapeHtml(label)}</span>`;
}

export type EmailDetailRow = { label: string; value: string };

export function emailDetailsTable(rows: EmailDetailRow[]): string {
  if (rows.length === 0) return "";

  const rowsHtml = rows
    .map(
      (row, index) => `<tr>
        <td style="padding:10px 12px;font-size:13px;color:${EMAIL_COLORS.muted};border-bottom:${index < rows.length - 1 ? `1px solid ${EMAIL_COLORS.border}` : "none"};white-space:nowrap;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 12px;font-size:13px;color:${EMAIL_COLORS.foreground};font-weight:500;border-bottom:${index < rows.length - 1 ? `1px solid ${EMAIL_COLORS.border}` : "none"};vertical-align:top;">${row.value}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:${EMAIL_COLORS.background};border-radius:8px;border:1px solid ${EMAIL_COLORS.border};overflow:hidden;">
    ${rowsHtml}
  </table>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.foreground};">${text}</p>`;
}

export function emailHighlightBox(text: string, accent: EmailAccent = "primary"): string {
  const { badgeBg, badgeColor } = ACCENT_STYLES[accent];
  return `<div style="margin:12px 0;padding:12px 14px;border-radius:8px;background:${badgeBg};border-left:3px solid ${badgeColor};font-size:14px;line-height:1.6;color:${EMAIL_COLORS.foreground};">${text}</div>`;
}

export function emailButton(label: string, href: string, accent: EmailAccent = "primary"): string {
  const { buttonBg } = ACCENT_STYLES[accent];
  const safeHref = escapeHtml(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;">
    <tr>
      <td style="border-radius:8px;background:${buttonBg};">
        <a href="${safeHref}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export type EmailLayoutInput = {
  title: string;
  preheader: string;
  badge: string;
  accent: EmailAccent;
  bodyHtml: string;
  cta?: { label: string; href: string };
};

/** Estructura HTML compartida por todas las plantillas de correo de Nido. */
export function renderEmailLayout(input: EmailLayoutInput): string {
  const { title, preheader, badge, accent, bodyHtml, cta } = input;
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);

  const ctaHtml = cta ? emailButton(cta.label, cta.href, accent) : "";

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_COLORS.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${EMAIL_COLORS.foreground};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_COLORS.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${EMAIL_COLORS.card};border-radius:12px;overflow:hidden;border:1px solid ${EMAIL_COLORS.border};">
            <tr>
              <td style="padding:24px 28px 20px;background:${EMAIL_COLORS.background};border-bottom:1px solid ${EMAIL_COLORS.border};">
                ${emailLogo()}
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <div style="margin-bottom:12px;">${emailBadge(badge, accent)}</div>
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;line-height:1.3;color:${EMAIL_COLORS.foreground};">${safeTitle}</h1>
                ${bodyHtml}
                ${ctaHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid ${EMAIL_COLORS.border};background:${EMAIL_COLORS.background};">
                <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL_COLORS.muted};">Notificación automática de Nido. No respondas a este correo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
