import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireVerifiedAuth } from "@/lib/server-auth";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireVerifiedAuth(request);
    const { amount } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Monto inválido." }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({
        message: "Stripe no configurado todavía. Define STRIPE_SECRET_KEY.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { uid },
    });

    assertAdminSdk();
    await adminDb!.collection("deposits").add({
      userId: uid,
      amount,
      method: "stripe",
      status: "pending",
      createdAt: new Date().toISOString(),
      stripePaymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      message: "Intención de pago creada y depósito registrado en pending.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al crear pago." },
      { status: 500 }
    );
  }
}
