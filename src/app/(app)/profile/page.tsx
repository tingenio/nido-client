"use client";

import { Pencil, UserPlus } from "lucide-react";
import { useState } from "react";

import { CreateAction } from "@/components/layout/create-action";
import { PageHeader } from "@/components/layout/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnablePushButton } from "@/features/notifications/components/enable-push-button";
import { EditProfileDialog } from "@/features/users/components/edit-profile-dialog";
import { HouseholdRanking } from "@/features/users/components/household-ranking";
import { AddMemberDialog } from "@/features/users/components/add-member-dialog";
import { useHouseholdMembers } from "@/features/users/hooks/use-household-members";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLE_LABELS } from "@/lib/labels";

export default function ProfilePage() {
  const { appUser } = useAuth();
  const { members, loading } = useHouseholdMembers();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Tu cuenta y el ranking del hogar." />

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <UserAvatar
            name={appUser?.name ?? "?"}
            photoURL={appUser?.photoURL}
            size="lg"
          />
          <div>
            <p className="text-lg font-semibold">{appUser?.name}</p>
            <p className="text-muted-foreground text-sm">
              {appUser && ROLE_LABELS[appUser.role]} · {appUser?.points ?? 0} pts
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Editar perfil
          </Button>
        </CardContent>
      </Card>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />

      <div className="space-y-2">
        <EnablePushButton />
        {appUser?.role === "admin" && (
          <CreateAction label="Agregar integrante" icon={UserPlus} variant="outline">
            {({ open, onOpenChange }) => (
              <AddMemberDialog open={open} onOpenChange={onOpenChange} />
            )}
          </CreateAction>
        )}
      </div>

      <HouseholdRanking
        members={members}
        currentUserId={appUser?.id}
        loading={loading}
      />
    </div>
  );
}
