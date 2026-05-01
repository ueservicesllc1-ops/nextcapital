import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { userId, amount, description } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ message: "userId inválido." }, { status: 400 });
    }
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ message: "Monto inválido." }, { status: 400 });
    }

    assertAdminSdk();

    const balanceRef = adminDb!.collection("balances").doc(userId);
    const balanceSnap = await balanceRef.get();
    const data = balanceSnap.data() ?? {
      userId,
      totalDeposited: 0,
      totalProfit: 0,
      currentBalance: 0,
    };

    await balanceRef.set(
      {
        ...data,
        userId,
        totalProfit: (data.totalProfit ?? 0) + amount,
        currentBalance: (data.currentBalance ?? 0) + amount,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await adminDb!.collection("transactions").add({
      userId,
      type: "profit",
      amount,
      status: "approved",
      description: description ?? "Rendimiento acreditado por admin",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Ganancia acreditada correctamente." });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "No se pudo acreditar la ganancia.",
      },
      { status: 500 }
    );
  }
}
