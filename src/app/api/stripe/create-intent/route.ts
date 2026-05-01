import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireVerifiedAuth } from "@/lib/server-auth";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireVerifiedAuth(request);
    const { amount, planId } = await request.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Monto inválido." }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({
        message: "Stripe no configurado todavía. Define STRIPE_SECRET_KEY.",
      });
    }

    const isTrading = planId === "wallet_topup" || planId === "trading_wallet_topup";
    const returnPath = isTrading ? "trading/wallet" : "dashboard/deposits";
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: isTrading ? "Recarga de Billetera de Trading" : `Adquisición de Plan ${planId?.toUpperCase()}`,
              description: "Depósito de capital en Next Capital Holdings",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${returnPath}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${returnPath}?canceled=true`,
      client_reference_id: uid,
      metadata: { uid, planId: planId || "unknown" },
    });

    assertAdminSdk();
    await adminDb!.collection("deposits").add({
      userId: uid,
      amount,
      planId: planId || "unknown",
      method: "stripe",
      status: "pending",
      createdAt: new Date().toISOString(),
      stripeSessionId: session.id,
    });

    return NextResponse.json({
      url: session.url,
      message: "Redirigiendo a pasarela segura de Stripe...",
    });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al crear pago." },
      { status: 500 }
    );
  }
}
