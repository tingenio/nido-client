import type { Timestamp } from "firebase/firestore";

export type ExpenseFrequency = "monthly" | "biweekly" | "weekly" | "yearly";

/** Documento en `households/{householdId}/funds/{fundId}` */
export interface Fund {
  id: string;
  name: string;
  /** Saldo disponible actual, en la unidad monetaria del hogar. */
  balance: number;
  createdAt: Timestamp;
}

export type FundMovementType = "income" | "expense";

/** Documento en `households/{householdId}/funds/{fundId}/movements/{movementId}` */
export interface FundMovement {
  id: string;
  type: FundMovementType;
  amount: number;
  description: string;
  relatedExpenseId?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export type ExpenseType = "recurring" | "variable";

/** Documento en `households/{householdId}/expenses/{expenseId}` */
export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  /** Fecha del gasto, formato yyyy-MM-dd. */
  date: string;
  type: ExpenseType;
  /** Solo para type === "recurring" */
  frequency?: ExpenseFrequency;
  /** Fondo del que se descuenta; si no hay, es un gasto general del hogar. */
  fundId?: string;
  createdBy: string;
  createdAt: Timestamp;
}
