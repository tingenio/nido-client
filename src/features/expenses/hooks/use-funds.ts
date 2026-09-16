"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { Fund } from "@/types";

export function useFunds() {
  const { appUser } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const q = query(
      collection(db, "households", appUser.householdId, "funds"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFunds(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Fund));
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser]);

  return { funds, loading };
}
