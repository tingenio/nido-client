"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireAdmin, requireAppUser, requireNotExternal } from "@/lib/auth/server";
import type { ExpenseFrequency, ExpenseType } from "@/types";

function household(householdId: string) {
  return adminDb().collection("households").doc(householdId);
}

export async function createFund(input: { idToken: string; name: string; initialBalance?: number }) {
  const requester = await requireAppUser(input.idToken);
  requireAdmin(requester);

  const fundRef = household(requester.householdId).collection("funds").doc();
  const initialBalance = input.initialBalance ?? 0;

  await adminDb().runTransaction(async (tx) => {
    tx.set(fundRef, {
      name: input.name,
      balance: initialBalance,
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
