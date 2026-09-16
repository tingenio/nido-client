"use client";

import { addDays, format, subDays } from "date-fns";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { TaskOccurrence } from "@/types";

export function useTaskOccurrences() {
  const { appUser } = useAuth();
  const [occurrences, setOccurrences] = useState<TaskOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const from = format(subDays(new Date(), 3), "yyyy-MM-dd");
    const to = format(addDays(new Date(), 14), "yyyy-MM-dd");

    const q = query(
      collection(db, "households", appUser.householdId, "taskOccurrences"),
      where("date", ">=", from),
      where("date", "<=", to),
      orderBy("date", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOccurrences(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskOccurrence),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser]);

  return { occurrences, loading };
}
