"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RejectTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment: string, penalty: number) => void;
  submitting: boolean;
}) {
  const [comment, setComment] = useState("");
  const [penalty, setPenalty] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolver tarea</DialogTitle>
          <DialogDescription>
            Explica qué falta. La tarea vuelve a quedar pendiente para que la rehagan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: faltó limpiar debajo de la mesa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="penalty">Puntos a restar (opcional)</Label>
            <Input
              id="penalty"
              type="number"
              min={0}
              value={penalty}
              onChange={(e) => setPenalty(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button
            disabled={submitting || comment.trim().length === 0}
            onClick={() => onConfirm(comment.trim(), penalty)}
          >
            Devolver tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
