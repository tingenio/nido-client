"use client";

import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { AppUser } from "@/types";

export function useHouseholdMembers() {
  const { appUser } = useAuth();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const q = query(
      collection(db, "users"),
      where("householdId", "==", appUser.householdId),
      orderBy("points", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AppUser));
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser]);

  return { members, loading };
}
