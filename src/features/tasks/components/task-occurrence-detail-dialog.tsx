"use client";

import { Calendar, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { UserLabel } from "@/components/ui/user-avatar";
import {
  completeOccurrence,
  deleteOccurrence,
  rejectOccurrence,
  toggleChecklistItem,
  verifyOccurrence,
} from "@/features/tasks/actions";
import { DeleteTaskDialog } from "@/features/tasks/components/delete-task-dialog";
import { RejectTaskDialog } from "@/features/tasks/components/reject-task-dialog";
import { useTaskMeta } from "@/features/tasks/hooks/use-task-meta";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import { cn } from "@/lib/utils";
import type { AppUser, TaskOccurrence } from "@/types";

const statusLabel: Record<TaskOccurrence["status"], string> = {
  pending: "Pendiente",
  completed: "Por verificar",
  verified: "Verificada",
  rejected: "Rechazada",
  overdue: "Vencida",
};

const statusVariant: Record<
  TaskOccurrence["status"],
  "outline" | "success" | "default" | "destructive" | "warning"
> = {
  pending: "outline",
  completed: "success",
  verified: "default",
  rejected: "destructive",
  overdue: "destructive",
};

type TaskOccurrenceDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrence: TaskOccurrence;
  membersById: Record<string, AppUser>;
};

export function TaskOccurrenceDetailDialog({
  open,
  onOpenChange,
  occurrence,
  membersById,
}: TaskOccurrenceDetailDialogProps) {
  const { appUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { task } = useTaskMeta(occurrence.taskId, open);

  if (!appUser) return null;

  const assignee = membersById[occurrence.assignedTo];
  const checklist = occurrence.checklist ?? [];
  const checkedCount = checklist.filter((item) => item.checked).length;
  const allChecked = checklist.length === 0 || checkedCount === checklist.length;

  const canToggleChecklist =
    (occurrence.status === "pending" || occurrence.status === "overdue") &&
    (occurrence.assignedTo === appUser.id || appUser.role === "admin");

  const canComplete =
    (occurrence.status === "pending" || occurrence.status === "overdue") &&
    (occurrence.assignedTo === appUser.id || appUser.role === "admin");

  const canReview =
    occurrence.status === "completed" &&
    appUser.role !== "external" &&
    occurrence.completedBy !== appUser.id;

  const canDelete =
    appUser.role !== "external" &&
    (appUser.role === "admin" ||
      (occurrence.status !== "completed" && task?.createdBy === appUser.id));

  async function handleToggleChecklist(itemId: string, checked: boolean) {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      await toggleChecklistItem({ idToken, occurrenceId: occurrence.id, itemId, checked });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el paso");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      await completeOccurrence({ idToken, occurrenceId: occurrence.id });
      toast.success("Tarea marcada como completada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      await verifyOccurrence({ idToken, occurrenceId: occurrence.id });
      toast.success(`Verificada · +${occurrence.points} pts para ${assignee?.name ?? "el integrante"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo verificar");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(comment: string, penalty: number) {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      await rejectOccurrence({ idToken, occurrenceId: occurrence.id, comment, penalty });
      toast.success("Tarea devuelta con comentario");
      setRejectOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo rechazar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(mode: "occurrence" | "series") {
    setBusy(true);
    try {
      const idToken = await getIdToken();
      await deleteOccurrence({ idToken, occurrenceId: occurrence.id, mode });
      const verified = occurrence.status === "verified";
      const points = occurrence.pointsAwarded ?? occurrence.points;
      if (mode === "series") {
        toast.success(
          verified
            ? `Tarea eliminada · ya no se repetirá · se restaron ${points} pts`
            : "Tarea eliminada · ya no se repetirá",
        );
      } else if (verified) {
        toast.success(`Tarea eliminada · se restaron ${points} pts`);
      } else {
        toast.success("Tarea eliminada");
      }
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  const footer =
    canComplete || canReview || canDelete ? (
      <>
        {canComplete && (
          <Button className="w-full" disabled={busy || !allChecked} onClick={handleComplete}>
            Marcar completada
          </Button>
        )}
        {canComplete && !allChecked && checklist.length > 0 && (
          <p className="text-muted-foreground text-center text-xs">
            Completa los {checklist.length} pasos del checklist para continuar.
          </p>
        )}
        {canReview && (
          <>
            <Button className="w-full" disabled={busy} onClick={handleVerify}>
              Verificar
            </Button>
            <Button variant="outline" className="w-full" disabled={busy} onClick={() => setRejectOpen(true)}>
              Devolver
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            variant="destructive"
            className="w-full"
            disabled={busy}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Eliminar tarea
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={onOpenChange}
        title={occurrence.title}
        headerExtra={
          <Badge variant={statusVariant[occurrence.status]}>{statusLabel[occurrence.status]}</Badge>
        }
        footer={footer}
      >
        <div className="space-y-4">
          {occurrence.description ? (
            <p className="text-sm leading-relaxed">{occurrence.description}</p>
          ) : null}

          <div className="text-muted-foreground space-y-2 text-sm">
            {assignee ? (
              <UserLabel name={assignee.name} photoURL={assignee.photoURL} />
            ) : (
              <p>—</p>
            )}
            <p className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0" />
              {occurrence.date} · {occurrence.points} pts
            </p>
          </div>

          {occurrence.reviewComment && (
            <p className="bg-muted flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
              <MessageSquare className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <span>{occurrence.reviewComment}</span>
            </p>
          )}

          {checklist.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Checklist</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {checkedCount}/{checklist.length} pasos
                </p>
              </div>
              <div className="bg-muted/50 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-[var(--brand-sage)] h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${checklist.length > 0 ? (checkedCount / checklist.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <label
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        canToggleChecklist && "hover:bg-muted/60 cursor-pointer",
                        !canToggleChecklist && "cursor-default",
                      )}
                    >
                      <Checkbox
                        checked={item.checked}
                        disabled={busy || !canToggleChecklist}
                        onCheckedChange={(checked) => handleToggleChecklist(item.id, Boolean(checked))}
                        className="mt-0.5"
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 leading-snug",
                          item.checked && "text-muted-foreground line-through",
                        )}
                      >
                        {item.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DetailDialog>

      <RejectTaskDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        submitting={busy}
      />

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        occurrence={occurrence}
        taskType={task?.type ?? null}
        assigneeName={assignee?.name}
        loading={busy}
        onConfirm={handleDelete}
      />
    </>
  );
}
