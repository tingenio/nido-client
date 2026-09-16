"use client";

import { Trophy, UserPlus } from "lucide-react";

import { CreateAction } from "@/components/layout/create-action";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EnablePushButton } from "@/features/notifications/components/enable-push-button";
import { InviteMemberDialog } from "@/features/users/components/invite-member-dialog";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { useAuth } from "@/lib/auth/auth-provider";
import { cn } from "@/lib/utils";

const roleLabel = { admin: "Admin", member: "Miembro", external: "Externo" } as const;

export default function ProfilePage() {
  const { appUser } = useAuth();
  const { members, loading } = useHouseholdMembers();

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Tu cuenta y el ranking del hogar." />

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">
              {appUser?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{appUser?.name}</p>
            <p className="text-muted-foreground text-sm">
              {appUser && roleLabel[appUser.role]} · {appUser?.points ?? 0} pts
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <EnablePushButton />
        {appUser?.role === "admin" && (
          <CreateAction label="Invitar integrante" icon={UserPlus} variant="outline">
            {({ open, onOpenChange }) => (
              <InviteMemberDialog open={open} onOpenChange={onOpenChange} />
            )}
          </CreateAction>
        )}
      </div>

      <div className="space-y-2">
        <SectionHeader title="Ranking del hogar" count={members.length} />
        {loading ? (
          <ListSkeleton count={4} />
        ) : members.length === 0 ? (
          <EmptyState icon={Trophy} message="Aún no hay integrantes en el hogar." />
        ) : (
          <Card>
            <CardContent className="divide-y py-0">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex h-14 items-center justify-between",
                    member.id === appUser?.id && "bg-primary/5 rounded-lg",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-medium",
                        index === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className={cn(member.id === appUser?.id && "font-medium")}>
                      {member.name}
                    </span>
                    {member.role !== "member" && (
                      <Badge variant="outline" className="text-[10px]">
                        {roleLabel[member.role]}
                      </Badge>
                    )}
                  </div>
                  <span className="tabular-nums font-medium">{member.points} pts</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
