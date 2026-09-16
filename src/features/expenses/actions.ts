"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAdmin, requireAppUser, requireNotExternal } from "@/lib/auth/server";
import type { ExpenseFrequency, ExpenseType } from "@/types";

function household(householdId: string) {
  return adminDb().collection("households").doc(householdId);
}

export async function createFund(input: {
  idToken: string;
  name: string;
  initialBalance?: number;
  targetAmount?: number;
}) {
  const requester = await requireAppUser(input.idToken);
  requireAdmin(requester);

  const fundRef = household(requester.householdId).collection("funds").doc();
  const initialBalance = input.initialBalance ?? 0;

  if (input.targetAmount != null && input.targetAmount <= 0) {
    throw new AuthError("La meta debe ser mayor a 0.");
  }

  await adminDb().runTransaction(async (tx) => {
    tx.set(fundRef, {
      name: input.name,
      balance: initialBalance,
      ...(input.targetAmount != null && input.targetAmount > 0
        ? { targetAmount: input.targetAmount }
        : {}),
      createdAt: FieldValue.serverTimestamp(),
    });
    if (initialBalance > 0) {
      tx.set(fundRef.collection("movements").doc(), {
        type: "income",
        amount: initialBalance,
        description: "Saldo inicial",
        createdBy: requester.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { fundId: fundRef.id };
}

export async function updateFundTarget(input: {
  idToken: string;
  fundId: string;
  targetAmount: number | null;
}) {
  const requester = await requireAppUser(input.idToken);
  requireAdmin(requester);

  if (input.targetAmount != null && input.targetAmount <= 0) {
    throw new AuthError("La meta debe ser mayor a 0.");
  }

  const fundRef = household(requester.householdId).collection("funds").doc(input.fundId);
  const fundSnap = await fundRef.get();
  if (!fundSnap.exists) throw new AuthError("El fondo ya no existe.");

  await fundRef.update({
    targetAmount:
      input.targetAmount == null ? FieldValue.delete() : input.targetAmount,
  });
}

export async function addFundIncome(input: {
  idToken: string;
  fundId: string;
  amount: number;
  description: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireAdmin(requester);
  if (input.amount <= 0) throw new AuthError("El monto debe ser mayor a 0.");

  const fundRef = household(requester.householdId).collection("funds").doc(input.fundId);

  await adminDb().runTransaction(async (tx) => {
    const fundSnap = await tx.get(fundRef);
    if (!fundSnap.exists) throw new AuthError("El fondo ya no existe.");

    tx.update(fundRef, { balance: FieldValue.increment(input.amount) });
    tx.set(fundRef.collection("movements").doc(), {
      type: "income",
      amount: input.amount,
      description: input.description,
      createdBy: requester.id,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function createExpense(input: {
  idToken: string;
  amount: number;
  category: string;
  description?: string;
  date: string; // yyyy-MM-dd
  type: ExpenseType;
  frequency?: ExpenseFrequency;
  fundId?: string;
}) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);
  if (input.amount <= 0) throw new AuthError("El monto debe ser mayor a 0.");

  const expenseRef = household(requester.householdId).collection("expenses").doc();

  await adminDb().runTransaction(async (tx) => {
    if (input.fundId) {
      const fundRef = household(requester.householdId).collection("funds").doc(input.fundId);
      const fundSnap = await tx.get(fundRef);
      if (!fundSnap.exists) throw new AuthError("El fondo seleccionado ya no existe.");

      const balance = fundSnap.data()!.balance as number;
      if (balance < input.amount) {
        throw new AuthError(
          `Fondo "${fundSnap.data()!.name}" sin saldo suficiente. Disponible: ${balance}.`,
        );
      }

      tx.update(fundRef, { balance: FieldValue.increment(-input.amount) });
      tx.set(fundRef.collection("movements").doc(), {
        type: "expense",
        amount: input.amount,
        description: input.description || input.category,
        relatedExpenseId: expenseRef.id,
        createdBy: requester.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    tx.set(expenseRef, {
      amount: input.amount,
      category: input.category,
      description: input.description ?? "",
      date: input.date,
      type: input.type,
      ...(input.frequency ? { frequency: input.frequency } : {}),
      ...(input.fundId ? { fundId: input.fundId } : {}),
      createdBy: requester.id,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { expenseId: expenseRef.id };
}

function billPaymentsRef(householdId: string) {
  return household(householdId).collection("billPayments");
}

export async function deleteExpense(input: { idToken: string; expenseId: string }) {
  const requester = await requireAppUser(input.idToken);
  requireNotExternal(requester);

  const expenseRef = household(requester.householdId).collection("expenses").doc(input.expenseId);
  const paymentsCol = billPaymentsRef(requester.householdId);

  await adminDb().runTransaction(async (tx) => {
    const expenseSnap = await tx.get(expenseRef);
    if (!expenseSnap.exists) throw new AuthError("El gasto ya no existe.");

    const expense = expenseSnap.data()!;
    const fundId = expense.fundId as string | undefined;

    if (fundId) {
      const fundRef = household(requester.householdId).collection("funds").doc(fundId);
      const fundSnap = await tx.get(fundRef);
      if (fundSnap.exists) {
        tx.update(fundRef, { balance: FieldValue.increment(expense.amount as number) });
        tx.set(fundRef.collection("movements").doc(), {
          type: "income",
          amount: expense.amount,
          description: `Reversión · ${expense.category}`,
          createdBy: requester.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    const linkedPayments = await tx.get(
      paymentsCol.where("expenseId", "==", input.expenseId).limit(1),
    );
    if (!linkedPayments.empty) {
      const paymentRef = linkedPayments.docs[0]!.ref;
      tx.update(paymentRef, {
        status: "pending",
        paidAt: FieldValue.delete(),
        paidBy: FieldValue.delete(),
        expenseId: FieldValue.delete(),
      });
    }

    tx.delete(expenseRef);
  });
}
