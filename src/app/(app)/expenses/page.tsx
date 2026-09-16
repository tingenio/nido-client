"use client";

import { Wallet } from "lucide-react";

import { CreateAction } from "@/components/layout/create-action";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillPaymentsView } from "@/features/expenses/components/bill-payments-view";
import { CreateFundDialog } from "@/features/expenses/components/create-fund-dialog";
import { FundCard } from "@/features/expenses/components/fund-card";
import { useFunds } from "@/features/expenses/hooks/use-funds";
import { useAuth } from "@/lib/auth/auth-provider";

export default function ExpensesPage() {
  const { appUser } = useAuth();
  const { funds, loading: loadingFunds } = useFunds();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gastos"
        description="Pagos del mes, gastos registrados y fondos del hogar."
      />

      <Tabs defaultValue="payments" className="min-w-0 space-y-4">
        <TabsList className="w-full">
          <TabsTrigger className="flex-1" value="payments">
            Pagos
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="funds">
            Fondos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="min-w-0 space-y-4">
          <BillPaymentsView />
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
