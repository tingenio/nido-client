import "server-only";

const ALLOWED_TAGS = new Set(["p", "br", "strong", "em", "ul", "ol", "li", "a"]);

function isSafeHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/**
 * Allowlist mínima para el HTML generado por el editor de Notas: evita que
 * contenido inyectado (o un cliente distinto al nuestro) inserte scripts u
 * otros tags al escribir en Firestore, ya que se renderiza luego con
 * `dangerouslySetInnerHTML` en modo solo-lectura.
 */
export function sanitizeNoteHtml(html: string): string {
  return html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    const isClosing = match.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) return "";
    if (isClosing) return `</${tag}>`;

    if (tag === "a") {
      const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/i);
      const href = hrefMatch?.[1]?.trim() ?? "";
      if (!isSafeHref(href)) return "";
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
    }

    return `<${tag}>`;
  });
}
