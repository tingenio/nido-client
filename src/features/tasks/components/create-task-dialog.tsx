"use client";

import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MicButton } from "@/components/mic-button";
import { Button } from "@/components/ui/button";
import { UserLabel } from "@/components/ui/user-avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createTask } from "@/features/tasks/actions";
import { assigneeEarnsPoints } from "@/features/tasks/lib/assignee-earns-points";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { getIdToken } from "@/lib/auth/get-id-token";
import { cn } from "@/lib/utils";
import type { TaskType, WeekDay } from "@/types";

const weekDays: { value: WeekDay; label: string }[] = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const { members } = useHouseholdMembers();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleListening, setTitleListening] = useState(false);
  const [descriptionListening, setDescriptionListening] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [points, setPoints] = useState(5);
  const [type, setType] = useState<TaskType>("once");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [days, setDays] = useState<Set<WeekDay>>(new Set());
  const [checklistSteps, setChecklistSteps] = useState<string[]>([""]);

  const selectedAssignee = members.find((m) => m.id === assignedTo);
  const showPoints = assigneeEarnsPoints(selectedAssignee);

  function toggleDay(day: WeekDay) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPoints(5);
    setType("once");
    setDueDate(format(new Date(), "yyyy-MM-dd"));
    setDays(new Set());
    setChecklistSteps([""]);
  }

  function updateChecklistStep(index: number, value: string) {
    setChecklistSteps((prev) => prev.map((step, i) => (i === index ? value : step)));
  }

  function addChecklistStep() {
    setChecklistSteps((prev) => [...prev, ""]);
  }

  function removeChecklistStep(index: number) {
    setChecklistSteps((prev) => (prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit() {
    if (!title.trim() || !assignedTo) {
      toast.error("Completa el título y a quién se la asignas");
      return;
    }
    if (type === "recurring" && days.size === 0) {
      toast.error("Selecciona al menos un día de la semana");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      await createTask({
        idToken,
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo,
        points: showPoints ? points : 0,
        type,
        dueDate: type === "once" ? dueDate : undefined,
        recurrence: type === "recurring" ? { daysOfWeek: Array.from(days) } : undefined,
        checklistItems: checklistSteps.filter((step) => step.trim()),
      });
      toast.success("Tarea creada");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la tarea");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>Asígnala a un integrante del hogar.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-title">Título</Label>
              <MicButton
                onListeningChange={setTitleListening}
                onResult={(text) =>
                  setTitle((prev) => (prev ? `${prev} ${text}` : text))
                }
              />
            </div>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                titleListening && "ring-2 ring-destructive/30 transition-shadow duration-300",
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-description">Descripción (opcional)</Label>
              <MicButton
                onListeningChange={setDescriptionListening}
                onResult={(text) =>
                  setDescription((prev) => (prev ? `${prev} ${text}` : text))
                }
              />
            </div>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                descriptionListening &&
                  "ring-2 ring-destructive/30 transition-shadow duration-300",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Asignar a</Label>
            <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un integrante">
                  {(() => {
                    const selected = members.find((m) => m.id === assignedTo);
                    return selected ? (
                      <UserLabel name={selected.name} photoURL={selected.photoURL} />
                    ) : null;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <UserLabel name={member.name} photoURL={member.photoURL} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showPoints && (
            <div className="space-y-2">
              <Label htmlFor="task-points">Puntos</Label>
              <Input
                id="task-points"
                type="number"
                min={0}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as TaskType)}>
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="once">
                  Única
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="recurring">
                  Recurrente
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {type === "once" ? (
            <div className="space-y-2">
              <Label htmlFor="task-due">Fecha</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-3">
                {weekDays.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={days.has(value)}
                      onCheckedChange={() => toggleDay(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pasos del checklist (opcional)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addChecklistStep}>
                <Plus className="size-3.5" />
                Agregar paso
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              La tarea no se podrá marcar como completada hasta marcar todos los pasos.
            </p>
            <div className="space-y-2">
              {checklistSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={step}
                    placeholder={`Paso ${index + 1}`}
                    onChange={(e) => updateChecklistStep(index, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar paso"
                    onClick={() => removeChecklistStep(index)}
                  >
                    <Trash2 className="text-muted-foreground size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button disabled={submitting} onClick={handleSubmit}>
            Crear tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
