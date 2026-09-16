"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { Task } from "@/types";

export function useTaskMeta(taskId: string | null, enabled: boolean) {
  const { appUser } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!appUser || !taskId || !enabled) {
      setTask(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, "households", appUser.householdId, "tasks", taskId);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setTask(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Task) : null);
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser, taskId, enabled]);

  return { task, loading };
}
