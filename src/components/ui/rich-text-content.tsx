import { cn } from "cn";

type RichTextContentProps = {
  html: string;
  className?: string;
};

/** Render de solo lectura para HTML generado por `RichTextEditor` (ya sanitizado en el servidor). */
export function RichTextContent({ html, className }: RichTextContentProps) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
