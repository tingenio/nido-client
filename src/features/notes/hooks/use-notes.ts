"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { Note } from "@/types";

export function useNotes() {
  const { appUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const q = query(
      collection(db, "households", appUser.householdId, "notes"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Note);
      docs.sort((a, b) => Number(b.pinned) - Number(a.pinned));
      setNotes(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser]);

  return { notes, loading };
}
