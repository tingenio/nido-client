"use client";

import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { db } from "@/lib/firebase/client";
import type { Expense } from "@/types";

/** Gastos del mes indicado (yyyy-MM), en tiempo real. */
export function useExpenses(month: string) {
  const { appUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const q = query(
      collection(db, "households", appUser.householdId, "expenses"),
      where("date", ">=", `${month}-01`),
      where("date", "<=", `${month}-31`),
      orderBy("date", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense));
      setLoading(false);
    });

    return unsubscribe;
  }, [appUser, month]);

  return { expenses, loading };
}
