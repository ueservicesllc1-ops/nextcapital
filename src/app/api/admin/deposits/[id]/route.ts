import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/server-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const { status } = await request.json();
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Estado inválido." }, { status: 400 });
    }

    assertAdminSdk();
    const ref = adminDb!.collection("deposits").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ message: "Depósito no encontrado." }, { status: 404 });
    }

    const deposit = snap.data()!;
    if (deposit.status !== "pending") {
      return NextResponse.json({ message: "Este depósito ya fue procesado." }, { status: 409 });
    }

    const isTrading = deposit.planId === "trading_wallet_topup" || deposit.planId === "wallet_topup" || deposit.isTrading === true;
    const balanceColl = isTrading ? "trading_balances" : "balances";
    const trxColl = isTrading ? "trading_transactions" : "transactions";

    await ref.update({
      status,
      approvedAt: status === "approved" ? new Date().toISOString() : null,
      processedAt: new Date().toISOString(),
    });

    if (status === "approved") {
      const balanceRef = adminDb!.collection(balanceColl).doc(deposit.userId);
      const balanceSnap = await balanceRef.get();
      const data = balanceSnap.data() ?? {
        userId: deposit.userId,
        totalDeposited: 0,
        totalProfit: 0,
        currentBalance: 0,
      };
      await balanceRef.set({
        ...data,
        totalDeposited: (data.totalDeposited ?? 0) + deposit.amount,
        currentBalance: (data.currentBalance ?? 0) + deposit.amount,
        updatedAt: new Date().toISOString(),
      });
      await adminDb!.collection(trxColl).add({
        userId: deposit.userId,
        type: "deposit",
        amount: deposit.amount,
        status: "approved",
        description: isTrading ? "Depósito de Trading aprobado por admin" : "Depósito de Inversión aprobado por admin",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ message: `Depósito ${status}.` });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar depósito." },
      { status: 500 }
    );
  }
}
