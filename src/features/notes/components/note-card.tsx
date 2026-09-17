"use client";

import { Pin } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NoteDetailDialog } from "@/features/notes/components/note-detail-dialog";
import { NOTE_CATEGORY_LABELS, type Note } from "@/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function NoteCard({ note }: { note: Note }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const snippet = stripHtml(note.contentHtml);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
        <CardContent className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {note.pinned && <Pin className="text-primary size-3.5 shrink-0 fill-current" />}
              <p className="truncate font-medium leading-tight">{note.title}</p>
            </div>
            {snippet && (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{snippet}</p>
            )}
            <Badge variant="outline" className="mt-2">
              {NOTE_CATEGORY_LABELS[note.category]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <NoteDetailDialog open={detailOpen} onOpenChange={setDetailOpen} note={note} />
    </>
  );
}
