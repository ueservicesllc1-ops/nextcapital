import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireVerifiedAuth } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireVerifiedAuth(request);
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Monto inválido." }, { status: 400 });
    }

    const today = new Date();
    const dayOfMonth = today.getDate();
    if (dayOfMonth < 28 || dayOfMonth > 30) {
      return NextResponse.json(
        { message: "Los retiros solo están habilitados los días 28, 29 y 30 de cada mes." },
        { status: 400 }
      );
    }

    assertAdminSdk();

    const balanceDoc = await adminDb!.collection("balances").doc(uid).get();
    const totalDeposited = balanceDoc.data()?.totalDeposited || 0;
    
    if (totalDeposited < 100) {
      return NextResponse.json(
        { message: "Debes tener al menos $100 USD en depósitos reales para habilitar los retiros." },
        { status: 400 }
      );
    }

    // Check if the user has enough currentBalance
    const currentBalance = balanceDoc.data()?.currentBalance || 0;
    if (amount > currentBalance) {
      return NextResponse.json(
        { message: "Fondos insuficientes para este retiro." },
        { status: 400 }
      );
    }
    await adminDb!.collection("withdrawals").add({
      userId: uid,
      amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    await adminDb!.collection("transactions").add({
      userId: uid,
      type: "withdrawal",
      amount,
      status: "pending",
      description: "Solicitud de retiro",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Retiro enviado con status pending." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo solicitar el retiro." },
      { status: 500 }
    );
  }
}
