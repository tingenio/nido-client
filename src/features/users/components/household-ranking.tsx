"use client";

import { Trophy } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

type HouseholdRankingProps = {
  members: AppUser[];
  currentUserId?: string;
  loading?: boolean;
};

function RankingRow({
  member,
  rank,
  isCurrentUser,
}: {
  member: AppUser;
  rank: number;
  isCurrentUser: boolean;
}) {
  const isFirst = rank === 1;

  return (
    <div
      className={cn(
        "grid min-h-[3.25rem] grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-3",
        isFirst && "bg-primary/8 ring-1 ring-primary/15",
        !isFirst && isCurrentUser && "bg-muted/60 ring-1 ring-primary/20",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center">
        {isFirst ? (
          <Trophy className="text-primary size-4" aria-hidden />
        ) : (
          <span className="text-muted-foreground text-sm font-medium tabular-nums">{rank}</span>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2.5">
        <UserAvatar name={member.name} photoURL={member.photoURL} className="shrink-0" />
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("truncate text-sm", isCurrentUser && "font-medium")}>
            {member.name}
          </span>
          {member.role !== "member" && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {ROLE_LABELS[member.role]}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-baseline gap-0.5 tabular-nums">
        <span className="text-sm font-semibold">{member.points}</span>
        <span className="text-muted-foreground text-xs">pts</span>
      </div>
    </div>
  );
}

export function HouseholdRanking({ members, currentUserId, loading }: HouseholdRankingProps) {
  return (
    <div className="border-border/60 mt-2 space-y-3 border-t pt-6">
      <SectionHeader title="Ranking del hogar" count={members.length} />
      {loading ? (
        <ListSkeleton count={4} />
      ) : members.length === 0 ? (
        <EmptyState icon={Trophy} message="Aún no hay integrantes en el hogar." />
      ) : (
        <Card>
          <CardContent className="space-y-1 p-2">
            {members.map((member, index) => (
              <RankingRow
                key={member.id}
                member={member}
                rank={index + 1}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
