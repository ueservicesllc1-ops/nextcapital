import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/server-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    assertAdminSdk();
    const { id } = await params;
    const { status } = await request.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Estado inválido." }, { status: 400 });
    }

    const withdrawalRef = adminDb!.collection("withdrawals").doc(id);
    const withdrawalSnap = await withdrawalRef.get();
    if (!withdrawalSnap.exists) {
      return NextResponse.json({ message: "Retiro no encontrado." }, { status: 404 });
    }

    const withdrawal = withdrawalSnap.data()!;
    if (withdrawal.status !== "pending") {
      return NextResponse.json({ message: "Este retiro ya fue procesado." }, { status: 409 });
    }

    if (status === "approved") {
      const balanceRef = adminDb!.collection("balances").doc(withdrawal.userId);
      const balanceSnap = await balanceRef.get();
      const balance = balanceSnap.data() ?? { currentBalance: 0, totalDeposited: 0, totalProfit: 0 };
      if ((balance.currentBalance ?? 0) < withdrawal.amount) {
        return NextResponse.json({ message: "Saldo insuficiente para aprobar el retiro." }, { status: 400 });
      }
      await balanceRef.set(
        {
          ...balance,
          userId: withdrawal.userId,
          currentBalance: (balance.currentBalance ?? 0) - withdrawal.amount,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await withdrawalRef.update({
      status,
      processedAt: new Date().toISOString(),
    });

    const trxQuery = await adminDb!
      .collection("transactions")
      .where("userId", "==", withdrawal.userId)
      .where("type", "==", "withdrawal")
      .where("amount", "==", withdrawal.amount)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!trxQuery.empty) {
      await trxQuery.docs[0].ref.update({ status });
    }

    return NextResponse.json({ message: `Retiro ${status}.` });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo procesar el retiro." },
      { status: 500 }
    );
  }
}
