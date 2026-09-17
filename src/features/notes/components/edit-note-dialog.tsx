"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateNote } from "@/features/notes/actions";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import { NOTE_CATEGORY_LABELS, type Note, type NoteCategory } from "@/types";

const CATEGORIES = Object.keys(NOTE_CATEGORY_LABELS) as NoteCategory[];

type EditNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
};

export function EditNoteDialog({ open, onOpenChange, note }: EditNoteDialogProps) {
  const { appUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [category, setCategory] = useState<NoteCategory>("otros");
  const [pinned, setPinned] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(note.title);
      setContentHtml(note.contentHtml);
      setCategory(note.category);
      setPinned(note.pinned);
    }
  }

  async function handleSubmit() {
    if (!appUser) return;
    if (!title.trim()) {
      toast.error("Completa el título");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await updateNote({
        idToken,
        noteId: note.id,
        title: title.trim(),
        contentHtml,
        category,
        pinned,
      });
      toast.success("Nota actualizada");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar nota</DialogTitle>
          <DialogDescription>Actualiza el contenido guardado.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-note-title">Título</Label>
              <Input
                id="edit-note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note-category">Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as NoteCategory)}>
                <SelectTrigger id="edit-note-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {NOTE_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contenido</Label>
              <RichTextEditor value={contentHtml} onChange={setContentHtml} />
            </div>

            <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-sm font-medium">Fijar como acceso rápido</span>
              <Switch checked={pinned} onCheckedChange={setPinned} />
            </label>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
