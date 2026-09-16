"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeOccurrence, rejectOccurrence, verifyOccurrence } from "@/features/tasks/actions";
import { RejectTaskDialog } from "@/features/tasks/components/reject-task-dialog";
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

const statusBorder: Record<TaskOccurrence["status"], string> = {
  pending: "border-l-primary",
  completed: "border-l-[var(--brand-sage)]",
  verified: "border-l-primary/60",
  rejected: "border-l-destructive",
  overdue: "border-l-destructive",
};

export function TaskOccurrenceCard({
  occurrence,
  membersById,
}: {
  occurrence: TaskOccurrence;
  membersById: Record<string, AppUser>;
}) {
  const { appUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  if (!appUser) return null;

  const assignee = membersById[occurrence.assignedTo];
  const canComplete =
    occurrence.status === "pending" || occurrence.status === "overdue"
      ? occurrence.assignedTo === appUser.id || appUser.role === "admin"
      : false;
  const canReview =
    occurrence.status === "completed" &&
    appUser.role !== "external" &&
    occurrence.completedBy !== appUser.id;

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

  const actionCount = (canComplete ? 1 : 0) + (canReview ? 2 : 0);

  return (
    <Card className={cn("border-l-4", statusBorder[occurrence.status])}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium leading-tight">{occurrence.title}</p>
            <p className="text-muted-foreground text-xs">
              {assignee?.name ?? "—"} · {occurrence.date} · {occurrence.points} pts
            </p>
          </div>
          <Badge variant={statusVariant[occurrence.status]}>{statusLabel[occurrence.status]}</Badge>
        </div>

        {occurrence.reviewComment && (
          <p className="bg-muted flex items-start gap-2 rounded-lg px-3 py-2 text-xs">
            <MessageSquare className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
            <span>{occurrence.reviewComment}</span>
          </p>
        )}

        {(canComplete || canReview) && (
          <div className="flex gap-2 pt-1">
            {canComplete && (
              <Button className="flex-1" disabled={busy} onClick={handleComplete}>
                Marcar completada
              </Button>
            )}
            {canReview && (
              <>
                <Button className="flex-1" disabled={busy} onClick={handleVerify}>
                  Verificar
                </Button>
                <Button
                  variant="outline"
                  className={actionCount > 1 ? "flex-1" : undefined}
                  disabled={busy}
                  onClick={() => setRejectOpen(true)}
                >
                  Devolver
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>

      <RejectTaskDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        submitting={busy}
      />
    </Card>
  );
}
