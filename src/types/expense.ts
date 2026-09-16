import type { Timestamp } from "firebase/firestore";

export type ExpenseFrequency = "monthly" | "biweekly" | "weekly" | "yearly";

/** Documento en `households/{householdId}/funds/{fundId}` */
export interface Fund {
  id: string;
  name: string;
  /** Saldo disponible actual, en la unidad monetaria del hogar. */
  balance: number;
  /** Meta de ahorro opcional, en la unidad monetaria del hogar. */
  targetAmount?: number;
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

export type BillPaymentStatus = "pending" | "paid";

export type BillRecurrence = "monthly" | "once";

/** Obligación del hogar (recurrente mensual o gasto pendiente de un solo mes). */
export interface Bill {
  id: string;
  name: string;
  amount: number;
  /** Día del mes en que se paga (1–31). Obligatorio en bills nuevos; opcional en legacy. */
  dueDay?: number;
  fundId?: string;
  active: boolean;
  /** Default implícito: "monthly" en documentos existentes. */
  recurrence?: BillRecurrence;
  /** Solo si recurrence === "once", formato yyyy-MM. */
  targetMonth?: string;
  createdBy: string;
  createdAt: Timestamp;
}

/** Cuota mensual de una obligación (`billId_month`, ej. abc_2026-03). */
export interface BillPayment {
  id: string;
  billId: string;
  /** Mes al que corresponde, formato yyyy-MM. */
  month: string;
  name: string;
  amount: number;
  dueDay?: number;
  fundId?: string;
  status: BillPaymentStatus;
  paidAt?: Timestamp;
  paidBy?: string;
  /** Gasto generado al marcar como pagado, si aplica. */
  expenseId?: string;
  /** Tipo de gasto al marcar pagado; default implícito "recurring". */
  expenseType?: ExpenseType;
  createdAt: Timestamp;
}

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
