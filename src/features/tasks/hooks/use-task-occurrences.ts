"use client";

import { format, subDays } from "date-fns";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { getQueryBounds, type TaskView } from "@/features/tasks/utils/date-ranges";
import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { TaskOccurrence } from "@/types";

type UseTaskOccurrencesOptions = {
  view: TaskView;
  anchorDate: Date;
};

export function useTaskOccurrences({ view, anchorDate }: UseTaskOccurrencesOptions) {
  const { appUser } = useAuth();
  const [occurrences, setOccurrences] = useState<TaskOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  const bounds = useMemo(() => getQueryBounds(view, anchorDate), [view, anchorDate]);

  useEffect(() => {
    if (!appUser) return;

    setLoading(true);

    const q = query(
      collection(db, "households", appUser.householdId, "taskOccurrences"),
      where("date", ">=", bounds.from),
      where("date", "<=", bounds.to),
      orderBy("date", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOccurrences(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskOccurrence),
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser, bounds.from, bounds.to]);

  return { occurrences, loading };
}

/** Rango amplio para contar atrasadas en el tab Hoy sin depender del filtro activo. */
export function useOverdueCount() {
  const { appUser } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!appUser) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const from = format(subDays(new Date(), 14), "yyyy-MM-dd");

    const q = query(
      collection(db, "households", appUser.householdId, "taskOccurrences"),
      where("date", ">=", from),
      where("date", "<", today),
      orderBy("date", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const overdue = snapshot.docs.filter((d) => {
        const status = d.data().status as TaskOccurrence["status"];
        return status === "pending" || status === "overdue" || status === "completed";
      });
      setCount(overdue.length);
    });

    return unsubscribe;
  }, [appUser]);

  return count;
}
