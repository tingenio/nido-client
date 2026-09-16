"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { FundMovement } from "@/types";

type MovementsSnapshot = {
  fundId: string;
  movements: FundMovement[];
};

export function useFundMovements(fundId: string | null) {
  const { appUser } = useAuth();
  const [snapshot, setSnapshot] = useState<MovementsSnapshot | null>(null);

  useEffect(() => {
    if (!appUser || !fundId) return;

    const q = query(
      collection(db, "households", appUser.householdId, "funds", fundId, "movements"),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, (result) => {
      setSnapshot({
        fundId,
        movements: result.docs.map((d) => ({ id: d.id, ...d.data() }) as FundMovement),
      });
    });

    return unsubscribe;
  }, [appUser, fundId]);

  if (!fundId) {
    return { movements: [], loading: false };
  }

  return {
    movements: snapshot?.fundId === fundId ? snapshot.movements : [],
    loading: snapshot?.fundId !== fundId,
  };
}
