"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ensureBillPaymentsForMonth,
  listBillPaymentsForMonth,
} from "@/features/expenses/bill-actions";
import { useAuth } from "@/lib/auth/auth-provider";
import { getIdToken } from "@/lib/auth/get-id-token";
import type { BillPayment } from "@/types";

export function sortBillPaymentsByDueDay(payments: BillPayment[]): BillPayment[] {
  return [...payments].sort((a, b) => (a.dueDay ?? 99) - (b.dueDay ?? 99));
}

function formatPaymentsError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/index/i.test(message)) {
    return "No se pudieron cargar los pagos. Falta un índice en Firestore.";
  }
  if (/permission|insufficient/i.test(message)) {
    return "No se pudieron cargar los pagos. Revisa permisos de Firestore.";
  }
  return "No se pudieron cargar los pagos. Intenta de nuevo.";
}

export function useBillPayments(month: string) {
  const { appUser } = useAuth();
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!appUser || appUser.role === "external") {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await getIdToken();
      await ensureBillPaymentsForMonth({ idToken, month });
      const { payments: next } = await listBillPaymentsForMonth({ idToken, month });
      setPayments(sortBillPaymentsByDueDay(next));
      setError(null);
    } catch (err) {
      console.error("useBillPayments:", err);
      setPayments([]);
      setError(formatPaymentsError(err));
    } finally {
      setLoading(false);
    }
  }, [appUser, month]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { payments, loading, error, refetch };
}
