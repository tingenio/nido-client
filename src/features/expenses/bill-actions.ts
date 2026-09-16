"use server";

import {
  FieldValue,
  type DocumentData,
  type Timestamp as AdminTimestamp,
} from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAppUser, requireNotExternal } from "@/lib/auth/server";
import type { BillPayment, ExpenseType } from "@/types";

function household(householdId: string) {
  return adminDb().collection("households").doc(householdId);
}

function billsRef(householdId: string) {
  return household(householdId).collection("bills");
}

function billPaymentsRef(householdId: string) {
  return household(householdId).collection("billPayments");
}

function paymentDocId(billId: string, month: string) {
  return `${billId}_${month}`;
}

function isMonthlyBill(bill: Record<string, unknown>): boolean {
  return bill.recurrence !== "once";
}

function assertValidMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new AuthError("El mes no es válido.");
  }
}

function buildPaymentDoc(
  bill: Record<string, unknown>,
  billId: string,
  month: string,
  expenseType: ExpenseType = "recurring",
): Omit<BillPayment, "id"> {
  const dueDay = bill.dueDay as number | undefined;
  return {
    billId,
    month,
    name: bill.name as string,
    amount: bill.amount as number,
    dueDay: dueDay ?? 99,
    ...(bill.fundId ? { fundId: bill.fundId as string } : {}),
    expenseType,
    status: "pending",
    createdAt: FieldValue.serverTimestamp() as unknown as BillPayment["createdAt"],
  };
}

export async function createBill(input: {
  idToken: string;
  month: string;
  name: string;
  amount: number;
  dueDay: number;
  fundId?: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  assertValidMonth(input.month);

  const name = input.name.trim();
  if (!name) throw new AuthError("El nombre es obligatorio.");
  if (input.amount <= 0) throw new AuthError("El monto debe ser mayor a 0.");
  if (input.dueDay < 1 || input.dueDay > 31) {
    throw new AuthError("El día de pago del mes es obligatorio (1–31).");
  }

  const billRef = billsRef(requester.householdId).doc();
  await billRef.set({
    name,
    amount: input.amount,
    dueDay: input.dueDay,
    ...(input.fundId ? { fundId: input.fundId } : {}),
    recurrence: "monthly",
    active: true,
    createdBy: requester.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  await billPaymentsRef(requester.householdId)
    .doc(paymentDocId(billRef.id, input.month))
    .set(
      buildPaymentDoc(
        {
          name,
          amount: input.amount,
          dueDay: input.dueDay,
          fundId: input.fundId,
        },
        billRef.id,
        input.month,
        "recurring",
      ),
    );

  await ensureBillPaymentsForMonth({ idToken: input.idToken, month: input.month });

  return { billId: billRef.id };
}

export async function createPlannedExpense(input: {
  idToken: string;
  month: string;
  name: string;
  amount: number;
  fundId?: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const name = input.name.trim();
  if (!name) throw new AuthError("El nombre es obligatorio.");
  if (input.amount <= 0) throw new AuthError("El monto debe ser mayor a 0.");
  if (!/^\d{4}-\d{2}$/.test(input.month)) {
    throw new AuthError("El mes no es válido.");
  }

  const billRef = billsRef(requester.householdId).doc();
  await billRef.set({
    name,
    amount: input.amount,
    ...(input.fundId ? { fundId: input.fundId } : {}),
    recurrence: "once",
    targetMonth: input.month,
    active: true,
    createdBy: requester.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  await billPaymentsRef(requester.householdId)
    .doc(paymentDocId(billRef.id, input.month))
    .set(
      buildPaymentDoc(
        {
          name,
          amount: input.amount,
          fundId: input.fundId,
        },
        billRef.id,
        input.month,
        "variable",
      ),
    );

  return { billId: billRef.id };
}

export async function ensureBillPaymentsForMonth(input: { idToken: string; month: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const billsSnap = await billsRef(requester.householdId).where("active", "==", true).get();
  if (billsSnap.empty) return { created: 0 };

  const batch = adminDb().batch();
  let created = 0;

  for (const billDoc of billsSnap.docs) {
    const billData = billDoc.data();
    if (!isMonthlyBill(billData)) continue;

    const paymentRef = billPaymentsRef(requester.householdId).doc(
      paymentDocId(billDoc.id, input.month),
    );
    const existing = await paymentRef.get();
    if (existing.exists) continue;

    batch.set(paymentRef, buildPaymentDoc(billData, billDoc.id, input.month, "recurring"));
    created += 1;
  }

  if (created > 0) await batch.commit();
  return { created };
}

function serializeTimestamp(value: unknown): { seconds: number; nanoseconds: number } | undefined {
  if (!value || typeof value !== "object") return undefined;

  if ("toDate" in value && typeof (value as AdminTimestamp).seconds === "number") {
    const ts = value as AdminTimestamp;
    return { seconds: ts.seconds, nanoseconds: ts.nanoseconds };
  }

  const legacy = value as { _seconds?: number; _nanoseconds?: number };
  if (typeof legacy._seconds === "number") {
    return { seconds: legacy._seconds, nanoseconds: legacy._nanoseconds ?? 0 };
  }

  return undefined;
}

function serializeBillPayment(id: string, data: DocumentData): BillPayment {
  const createdAt = serializeTimestamp(data.createdAt);
  const paidAt = serializeTimestamp(data.paidAt);

  return {
    id,
    billId: data.billId as string,
    month: data.month as string,
    name: data.name as string,
    amount: data.amount as number,
    ...(data.dueDay != null ? { dueDay: data.dueDay as number } : {}),
    ...(data.fundId ? { fundId: data.fundId as string } : {}),
    status: data.status as BillPayment["status"],
    ...(data.paidBy ? { paidBy: data.paidBy as string } : {}),
    ...(data.expenseId ? { expenseId: data.expenseId as string } : {}),
    ...(data.expenseType ? { expenseType: data.expenseType as ExpenseType } : {}),
    createdAt: (createdAt ?? { seconds: 0, nanoseconds: 0 }) as unknown as BillPayment["createdAt"],
    ...(paidAt ? { paidAt: paidAt as unknown as BillPayment["paidAt"] } : {}),
  };
}

export async function listBillPaymentsForMonth(input: { idToken: string; month: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);
  assertValidMonth(input.month);

  const snap = await billPaymentsRef(requester.householdId)
    .where("month", "==", input.month)
    .get();

  return {
    payments: snap.docs.map((doc) => serializeBillPayment(doc.id, doc.data())),
  };
}

export async function markBillPaymentPaid(input: { idToken: string; paymentId: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const paymentRef = billPaymentsRef(requester.householdId).doc(input.paymentId);

  await adminDb().runTransaction(async (tx) => {
    const paymentSnap = await tx.get(paymentRef);
    if (!paymentSnap.exists) throw new AuthError("El pago no existe.");

    const payment = paymentSnap.data()!;
    if (payment.status === "paid") return;

    const expenseType = (payment.expenseType as ExpenseType | undefined) ?? "recurring";
    const expenseRef = household(requester.householdId).collection("expenses").doc();
    const expenseDate = `${payment.month}-01`;

    if (payment.fundId) {
      const fundRef = household(requester.householdId).collection("funds").doc(payment.fundId);
      const fundSnap = await tx.get(fundRef);
      if (!fundSnap.exists) throw new AuthError("El fondo asociado ya no existe.");

      const balance = fundSnap.data()!.balance as number;
      if (balance < payment.amount) {
        throw new AuthError(
          `Fondo sin saldo suficiente. Disponible: ${balance}.`,
        );
      }

      tx.update(fundRef, { balance: FieldValue.increment(-payment.amount) });
      tx.set(fundRef.collection("movements").doc(), {
        type: "expense",
        amount: payment.amount,
        description: payment.name,
        relatedExpenseId: expenseRef.id,
        createdBy: requester.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    tx.set(expenseRef, {
      amount: payment.amount,
      category: payment.name,
      description:
        expenseType === "recurring"
          ? `Pago mensual · ${payment.month}`
          : `Gasto pendiente · ${payment.month}`,
      date: expenseDate,
      type: expenseType,
      ...(expenseType === "recurring" ? { frequency: "monthly" as const } : {}),
      ...(payment.fundId ? { fundId: payment.fundId } : {}),
      createdBy: requester.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    tx.update(paymentRef, {
      status: "paid",
      paidAt: FieldValue.serverTimestamp(),
      paidBy: requester.id,
      expenseId: expenseRef.id,
    });
  });
}

export async function markBillPaymentUnpaid(input: { idToken: string; paymentId: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const paymentRef = billPaymentsRef(requester.householdId).doc(input.paymentId);
  const expensesCol = household(requester.householdId).collection("expenses");

  await adminDb().runTransaction(async (tx) => {
    const paymentSnap = await tx.get(paymentRef);
    if (!paymentSnap.exists) throw new AuthError("El pago no existe.");

    const payment = paymentSnap.data()!;
    if (payment.status !== "paid") return;

    if (payment.expenseId) {
      const expenseRef = expensesCol.doc(payment.expenseId);
      const expenseSnap = await tx.get(expenseRef);

      if (payment.fundId && expenseSnap.exists) {
        const fundRef = household(requester.householdId).collection("funds").doc(payment.fundId);
        tx.update(fundRef, { balance: FieldValue.increment(payment.amount) });
        tx.set(fundRef.collection("movements").doc(), {
          type: "income",
          amount: payment.amount,
          description: `Reversión · ${payment.name}`,
          createdBy: requester.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      if (expenseSnap.exists) {
        tx.delete(expenseRef);
      }
    }

    tx.update(paymentRef, {
      status: "pending",
      paidAt: FieldValue.delete(),
      paidBy: FieldValue.delete(),
      expenseId: FieldValue.delete(),
    });
  });
}

export async function deleteBillPayment(input: { idToken: string; paymentId: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const paymentRef = billPaymentsRef(requester.householdId).doc(input.paymentId);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists) throw new AuthError("El pago no existe.");

  const payment = paymentSnap.data()!;
  if (payment.status === "paid") {
    throw new AuthError("No se puede eliminar un pago ya pagado.");
  }

  const billRef = billsRef(requester.householdId).doc(payment.billId);
  const billSnap = await billRef.get();

  if (billSnap.exists) {
    const bill = billSnap.data()!;
    if (bill.recurrence === "once") {
      if (payment.expenseType !== "variable") {
        throw new AuthError("Solo se pueden eliminar gastos pendientes del mes.");
      }
    }
  }

  await paymentRef.delete();
  if (billSnap.exists) {
    await billRef.delete();
  }
}

/** @deprecated Usar deleteBillPayment */
export async function deletePlannedExpense(input: { idToken: string; paymentId: string }) {
  return deleteBillPayment(input);
}

export async function deactivateBill(input: { idToken: string; billId: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  await billsRef(requester.householdId).doc(input.billId).update({ active: false });
}
