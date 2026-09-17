"use client";

import { Pin } from "lucide-react";
import { useState } from "react";

import { NoteDetailDialog } from "@/features/notes/components/note-detail-dialog";
import type { Note } from "@/types";

export function QuickAccessStrip({ notes }: { notes: Note[] }) {
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const pinned = notes.filter((n) => n.pinned);

  if (pinned.length === 0) return null;

  return (
    <>
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
        {pinned.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setActiveNote(note)}
            className="bg-primary/10 text-primary flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors hover:bg-primary/20"
          >
            <Pin className="size-3.5 fill-current" />
            {note.title}
          </button>
        ))}
      </div>

      {activeNote && (
        <NoteDetailDialog
          open={Boolean(activeNote)}
          onOpenChange={(open) => !open && setActiveNote(null)}
          note={activeNote}
        />
      )}
    </>
  );
}
