"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { Reminder } from "@/types";

export function useReminders() {
  const { appUser } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const q = query(
      collection(db, "households", appUser.householdId, "reminders"),
      orderBy("dueAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReminders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Reminder));
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser]);

  return { reminders, loading };
}
