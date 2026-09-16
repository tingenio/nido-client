"use client";

import { format } from "date-fns";
import { Receipt, Wallet } from "lucide-react";

import { CreateAction } from "@/components/layout/create-action";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateExpenseDialog } from "@/features/expenses/components/create-expense-dialog";
import { CreateFundDialog } from "@/features/expenses/components/create-fund-dialog";
import { ExpenseListItem } from "@/features/expenses/components/expense-list-item";
import { FundCard } from "@/features/expenses/components/fund-card";
import { MonthlySummary } from "@/features/expenses/components/monthly-summary";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { useFunds } from "@/features/expenses/hooks/use-funds";
import { useAuth } from "@/lib/auth/auth-provider";

export default function ExpensesPage() {
  const { appUser } = useAuth();
  const currentMonth = format(new Date(), "yyyy-MM");
  const { expenses, loading: loadingExpenses } = useExpenses(currentMonth);
  const { funds, loading: loadingFunds } = useFunds();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gastos"
        description="Controla los gastos y fondos del hogar."
      />

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger className="flex-1" value="expenses">
            Gastos
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="funds">
            Fondos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <CreateAction label="Nuevo gasto" icon={Receipt}>
            {({ open, onOpenChange }) => (
              <CreateExpenseDialog open={open} onOpenChange={onOpenChange} />
            )}
          </CreateAction>

          {loadingExpenses ? (
            <ListSkeleton count={2} />
          ) : (
            <>
              <MonthlySummary expenses={expenses} />
              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <EmptyState icon={Receipt} message="Sin gastos registrados este mes." />
                ) : (
                  expenses.map((expense, index) => (
                    <div key={expense.id} className="list-item-enter" style={{ "--index": index } as React.CSSProperties}>
                      <ExpenseListItem expense={expense} />
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="funds" className="space-y-4">
          {appUser?.role === "admin" && (
            <CreateAction label="Nuevo fondo" icon={Wallet} variant="outline">
              {({ open, onOpenChange }) => (
                <CreateFundDialog open={open} onOpenChange={onOpenChange} />
              )}
            </CreateAction>
          )}

          {loadingFunds ? (
            <ListSkeleton count={2} />
          ) : funds.length === 0 ? (
            <EmptyState icon={Wallet} message="Aún no hay fondos creados." />
          ) : (
            <div className="space-y-2">
              {funds.map((fund, index) => (
                <div key={fund.id} className="list-item-enter" style={{ "--index": index } as React.CSSProperties}>
                  <FundCard fund={fund} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
