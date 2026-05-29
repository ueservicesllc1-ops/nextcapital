import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate request as Admin
    await requireAdmin(request);
    
    const { userId, planId, amount } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ message: "userId inválido." }, { status: 400 });
    }

    assertAdminSdk();

    // Plan values
    const PLANS_INFO: Record<string, { name: string; amount: number }> = {
      "NC-S1": { name: "Minería Starter", amount: 149 },
      "NC-P2": { name: "Minería Pro", amount: 329 },
      "NC-I3": { name: "Minería Industrial", amount: 599 },
    };

    if (planId && !PLANS_INFO[planId]) {
      return NextResponse.json({ message: "ID de plan inválido." }, { status: 400 });
    }

    const db = adminDb!;
    
    // Create an approved deposit for the contract
    const depositRef = db.collection("deposits").doc();
    const depositAmount = amount ?? (planId ? PLANS_INFO[planId].amount : 0);

    const depositData = {
      userId,
      amount: depositAmount,
      planId,
      status: "approved",
      method: "manual_admin",
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      reference: `Asignación manual de contrato hashrate — ${planId}`,
    };

    await depositRef.set(depositData);

    // Update balances
    const balanceRef = db.collection("balances").doc(userId);
    const balanceSnap = await balanceRef.get();
    
    if (balanceSnap.exists) {
      const current = balanceSnap.data()!;
      await balanceRef.update({
        totalDeposited: (current.totalDeposited ?? 0) + depositAmount,
        currentBalance: (current.currentBalance ?? 0) + depositAmount,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await balanceRef.set({
        userId,
        totalDeposited: depositAmount,
        totalProfit: 0,
        currentBalance: depositAmount,
        updatedAt: new Date().toISOString(),
      });
    }

    // Add a tracking transaction
    await db.collection("transactions").add({
      userId,
      type: "deposit",
      amount: depositAmount,
      status: "approved",
      description: `Contrato de Hashrate ${planId} provisto por Admin`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: `¡Contrato ${planId} asignado y activado exitosamente para el usuario!` 
    });
  } catch (error) {
    console.error("[Mining Admin Assign Plan] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error interno al asignar plan." },
      { status: 500 }
    );
  }
}
