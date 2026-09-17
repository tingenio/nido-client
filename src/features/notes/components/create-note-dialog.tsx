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
import { createNote } from "@/features/notes/actions";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import { NOTE_CATEGORY_LABELS, type NoteCategory } from "@/types";

const CATEGORIES = Object.keys(NOTE_CATEGORY_LABELS) as NoteCategory[];

type CreateNoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateNoteDialog({ open, onOpenChange }: CreateNoteDialogProps) {
  const { appUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [category, setCategory] = useState<NoteCategory>("otros");
  const [pinned, setPinned] = useState(false);

  function reset() {
    setTitle("");
    setContentHtml("");
    setCategory("otros");
    setPinned(false);
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
      await createNote({ idToken, title: title.trim(), contentHtml, category, pinned });
      toast.success("Nota creada");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva nota</DialogTitle>
          <DialogDescription>Visible para todo el hogar (excepto externos).</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="note-title">Título</Label>
              <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-category">Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as NoteCategory)}>
                <SelectTrigger id="note-category" className="w-full">
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
              <RichTextEditor
                value={contentHtml}
                onChange={setContentHtml}
                placeholder="Wifi, claves, links de acceso..."
              />
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
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
