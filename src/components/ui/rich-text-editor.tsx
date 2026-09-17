"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Link2, Link2Off, List, ListOrdered } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [linkPromptOpen, setLinkPromptOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Escribe aquí..." }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-24 text-sm leading-relaxed focus:outline-none [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
  });

  if (!editor) return null;

  function openLinkPrompt() {
    setLinkUrl(editor?.getAttributes("link").href ?? "");
    setLinkPromptOpen(true);
  }

  function applyLink() {
    const url = normalizeUrl(linkUrl);
    if (!url) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkPromptOpen(false);
  }

  return (
    <div className={cn("space-y-2 rounded-lg border border-input px-1 py-1", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b px-1 pb-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={editor.isActive("bold")}
          className={cn(editor.isActive("bold") && "bg-muted text-foreground")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={editor.isActive("italic")}
          className={cn(editor.isActive("italic") && "bg-muted text-foreground")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={editor.isActive("bulletList")}
          className={cn(editor.isActive("bulletList") && "bg-muted text-foreground")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={editor.isActive("orderedList")}
          className={cn(editor.isActive("orderedList") && "bg-muted text-foreground")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={editor.isActive("link")}
          className={cn(editor.isActive("link") && "bg-muted text-foreground")}
          onClick={openLinkPrompt}
        >
          <Link2 className="size-4" />
        </Button>
        {editor.isActive("link") && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Link2Off className="size-4" />
          </Button>
        )}
      </div>

      {linkPromptOpen && (
        <div className="flex items-center gap-2 px-2 pb-1">
          <Input
            autoFocus
            placeholder="https://ejemplo.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinkPromptOpen(false);
            }}
            className="h-9"
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Aplicar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setLinkPromptOpen(false)}>
            Cancelar
          </Button>
        </div>
      )}

      <EditorContent editor={editor} className="px-2.5 pb-2" />
    </div>
  );
}
