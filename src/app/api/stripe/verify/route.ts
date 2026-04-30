import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireVerifiedAuth } from "@/lib/server-auth";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
  : null;

export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireVerifiedAuth(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ message: "Falta el ID de sesión." }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ message: "Stripe no configurado." }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      assertAdminSdk();
      
      const query = await adminDb!
        .collection("deposits")
        .where("stripeSessionId", "==", session.id)
        .limit(1)
        .get();

      if (!query.empty) {
        const depositRef = query.docs[0].ref;
        const deposit = query.docs[0].data();
        
        // Solo actualizamos si no ha sido aprobado ya (por el webhook u otro medio)
        if (deposit.status !== "approved") {
          await depositRef.update({
            status: "approved",
            processedAt: new Date().toISOString(),
          });
          
          const balanceRef = adminDb!.collection("balances").doc(deposit.userId);
          const balanceSnap = await balanceRef.get();
          const current = balanceSnap.data() ?? {
            userId: deposit.userId,
            totalDeposited: 0,
            totalProfit: 0,
            currentBalance: 0,
          };
          
          await balanceRef.set(
            {
              ...current,
              totalDeposited: (current.totalDeposited ?? 0) + deposit.amount,
              currentBalance: (current.currentBalance ?? 0) + deposit.amount,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          
          await adminDb!.collection("transactions").add({
            userId: deposit.userId,
            type: "deposit",
            amount: deposit.amount,
            status: "approved",
            description: "Plan de inversión adquirido vía Stripe",
            createdAt: new Date().toISOString(),
          });
          
          return NextResponse.json({ success: true, message: "Depósito aprobado instantáneamente." });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Depósito ya estaba aprobado o pago pendiente." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al verificar." },
      { status: 500 }
    );
  }
}
