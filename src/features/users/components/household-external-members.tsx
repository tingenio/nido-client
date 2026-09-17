"use client";

import { Pencil, Users } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

type HouseholdExternalMembersProps = {
  members: AppUser[];
  currentUserId?: string;
  loading?: boolean;
  canManage?: boolean;
  onEditMember?: (member: AppUser) => void;
};

function ExternalMemberRow({
  member,
  isCurrentUser,
  canManage,
  onEdit,
}: {
  member: AppUser;
  isCurrentUser: boolean;
  canManage?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div
      className={cn(
        "grid min-h-[3.25rem] grid-cols-[1fr_auto] items-center gap-3 rounded-lg px-3 py-3",
        isCurrentUser && "bg-muted/60 ring-1 ring-primary/20",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <UserAvatar name={member.name} photoURL={member.photoURL} className="shrink-0" />
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("truncate text-sm", isCurrentUser && "font-medium")}>{member.name}</span>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {ROLE_LABELS.external}
          </Badge>
        </div>
      </div>

      {canManage && onEdit ? (
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${member.name}`} onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function HouseholdExternalMembers({
  members,
  currentUserId,
  loading,
  canManage,
  onEditMember,
}: HouseholdExternalMembersProps) {
  if (!loading && members.length === 0) return null;

  return (
    <div className="border-border/60 mt-2 space-y-3 border-t pt-6">
      <SectionHeader title="Personal externo" count={members.length} />
      {loading ? (
        <ListSkeleton count={2} />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} message="No hay personal externo en el hogar." />
      ) : (
        <Card className="py-0">
          <CardContent className="space-y-1 p-2">
            {members.map((member) => (
              <ExternalMemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
                canManage={canManage}
                onEdit={onEditMember ? () => onEditMember(member) : undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
