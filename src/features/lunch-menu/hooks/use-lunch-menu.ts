"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import { WEEKDAYS, type LunchMenuEntry, type Weekday } from "@/types";

export function useLunchMenu() {
  const { appUser } = useAuth();
  const [menu, setMenu] = useState<Partial<Record<Weekday, LunchMenuEntry>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "households", appUser.householdId, "lunchMenu"),
      (snapshot) => {
        const next: Partial<Record<Weekday, LunchMenuEntry>> = {};
        for (const docSnap of snapshot.docs) {
          const weekday = docSnap.id as Weekday;
          if (WEEKDAYS.includes(weekday)) {
            next[weekday] = { id: weekday, ...docSnap.data() } as LunchMenuEntry;
          }
        }
        setMenu(next);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [appUser]);

  return { menu, loading };
}
