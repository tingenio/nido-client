"use client";

import { Copy, Pencil, Pin, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { deleteNote } from "@/features/notes/actions";
import { DeleteNoteDialog } from "@/features/notes/components/delete-note-dialog";
import { EditNoteDialog } from "@/features/notes/components/edit-note-dialog";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import { NOTE_CATEGORY_LABELS, type Note } from "@/types";

type NoteDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
};

export function NoteDetailDialog({ open, onOpenChange, note }: NoteDetailDialogProps) {
  const { appUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!appUser) return null;

  async function copyContent() {
    const plainText = note.contentHtml
      .replace(/<\/(p|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    try {
      await navigator.clipboard.writeText(plainText);
      toast.success("Contenido copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const idToken = await getIdToken();
      await deleteNote({ idToken, noteId: note.id });
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={onOpenChange}
        title={note.title}
        headerExtra={note.pinned ? <Pin className="text-primary size-4 shrink-0 fill-current" /> : undefined}
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={copyContent}>
              <Copy className="size-4" />
              Copiar contenido
            </Button>
            <Button className="w-full" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Editar nota
            </Button>
            <Button variant="destructive" className="w-full" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Eliminar nota
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Badge variant="secondary">{NOTE_CATEGORY_LABELS[note.category]}</Badge>
          <RichTextContent html={note.contentHtml} />
        </div>
      </DetailDialog>

      <EditNoteDialog open={editOpen} onOpenChange={setEditOpen} note={note} />

      <DeleteNoteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={note.title}
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
