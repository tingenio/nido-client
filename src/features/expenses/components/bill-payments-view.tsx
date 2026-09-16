"use client";

import { format } from "date-fns";
import { CalendarCheck, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CreateAction } from "@/components/layout/create-action";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { Button } from "@/components/ui/button";
import { BillPaymentItem } from "@/features/expenses/components/bill-payment-item";
import { BillPaymentsSummary } from "@/features/expenses/components/bill-payments-summary";
import { CreateBillDialog } from "@/features/expenses/components/create-bill-dialog";
import { CreateExpenseDialog } from "@/features/expenses/components/create-expense-dialog";
import { ExpenseListItem } from "@/features/expenses/components/expense-list-item";
import { MonthNav } from "@/features/expenses/components/month-nav";
import { MonthlySummary } from "@/features/expenses/components/monthly-summary";
import {
  sortBillPaymentsByDueDay,
  useBillPayments,
} from "@/features/expenses/hooks/use-bill-payments";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import type { BillPayment } from "@/types";

const STORAGE_KEY = "nido:expenses-payments-month";

function readStoredMonth(): string {
  if (typeof window === "undefined") return format(new Date(), "yyyy-MM");
  return localStorage.getItem(STORAGE_KEY) ?? format(new Date(), "yyyy-MM");
}

function paymentKindLabel(payment: BillPayment): string {
  return payment.expenseType === "variable" ? "Solo este mes" : "Cada mes";
}

export function BillPaymentsView() {
  const [month, setMonth] = useState(readStoredMonth);
  const {
    payments,
    loading: loadingPayments,
    error: paymentsError,
    refetch,
  } = useBillPayments(month);
  const { expenses, loading: loadingExpenses } = useExpenses(month);

  const loading = loadingPayments || loadingExpenses;

  const pendingPayments = useMemo(
    () => sortBillPaymentsByDueDay(payments.filter((p) => p.status === "pending")),
    [payments],
  );

  const pendingSummary = useMemo(
    () => ({
      count: pendingPayments.length,
      amount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
    }),
    [pendingPayments],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, month);
  }, [month]);

  function handleMonthChange(nextMonth: string) {
    setMonth(nextMonth);
  }

  function handlePaymentsUpdated() {
    void refetch();
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <MonthNav month={month} onMonthChange={handleMonthChange} />

      <div className="grid grid-cols-1 gap-2">
        <div className="min-w-0">
          <CreateAction label="Pago fijo (cada mes)" icon={CalendarCheck} variant="outline">
            {({ open, onOpenChange }) => (
              <CreateBillDialog
                month={month}
                open={open}
                onOpenChange={onOpenChange}
                onCreated={handlePaymentsUpdated}
              />
            )}
          </CreateAction>
        </div>
        <div className="min-w-0">
          <CreateAction label="Registrar gasto" icon={Receipt}>
            {({ open, onOpenChange }) => (
              <CreateExpenseDialog open={open} onOpenChange={onOpenChange} />
            )}
          </CreateAction>
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Por pagar</h2>
            {paymentsError ? (
              <div className="space-y-3">
                <EmptyState icon={CalendarCheck} message={paymentsError} />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => void refetch()}
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <>
                <BillPaymentsSummary pending={pendingSummary} />
                {pendingPayments.length === 0 ? (
                  <EmptyState
                    icon={CalendarCheck}
                    message="No tienes pagos pendientes este mes."
                  />
                ) : (
                  <div className="space-y-2">
                    {pendingPayments.map((payment, index) => (
                      <div
                        key={payment.id}
                        className="list-item-enter"
                        style={{ "--index": index } as React.CSSProperties}
                      >
                        <BillPaymentItem
                          payment={payment}
                          kindLabel={paymentKindLabel(payment)}
                          deletable
                          onUpdated={handlePaymentsUpdated}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Gastos del mes</h2>
            {expenses.length === 0 ? (
              <EmptyState icon={Receipt} message="Sin gastos registrados este mes." />
            ) : (
              <>
                <MonthlySummary expenses={expenses} />
                <div className="space-y-2">
                  {expenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="list-item-enter"
                      style={{ "--index": index } as React.CSSProperties}
                    >
                      <ExpenseListItem expense={expense} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
