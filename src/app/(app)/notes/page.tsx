"use client";

import { StickyNote } from "lucide-react";

import { CreateAction } from "@/components/layout/create-action";
import { PageHeader } from "@/components/layout/page-header";
import { CreateNoteDialog } from "@/features/notes/components/create-note-dialog";
import { NoteList } from "@/features/notes/components/note-list";
import { QuickAccessStrip } from "@/features/notes/components/quick-access-strip";
import { useNotes } from "@/features/notes/hooks/use-notes";

export default function NotesPage() {
  const { notes, loading } = useNotes();

  return (
    <div className="space-y-6">
      <PageHeader title="Notas" description="Claves, accesos y links que no queremos olvidar." />

      <CreateAction label="Nueva nota" icon={StickyNote}>
        {({ open, onOpenChange }) => <CreateNoteDialog open={open} onOpenChange={onOpenChange} />}
      </CreateAction>

      {!loading && <QuickAccessStrip notes={notes} />}

      <NoteList notes={notes} loading={loading} />
    </div>
  );
}
