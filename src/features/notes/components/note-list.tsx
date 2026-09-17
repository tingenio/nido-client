"use client";

import { StickyNote } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { NoteCard } from "@/features/notes/components/note-card";
import type { Note } from "@/types";

type NoteListProps = {
  notes: Note[];
  loading: boolean;
};

export function NoteList({ notes, loading }: NoteListProps) {
  if (loading) {
    return <ListSkeleton />;
  }

  if (notes.length === 0) {
    return <EmptyState icon={StickyNote} message="Aún no hay notas guardadas." />;
  }

  return (
    <div className="space-y-2">
      {notes.map((note, index) => (
        <div key={note.id} className="list-item-enter" style={{ "--index": index } as React.CSSProperties}>
          <NoteCard note={note} />
        </div>
      ))}
    </div>
  );
}
