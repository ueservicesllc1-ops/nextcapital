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

    assertAdminSdk();
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
