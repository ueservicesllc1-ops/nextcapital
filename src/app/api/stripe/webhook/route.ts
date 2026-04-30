import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
  : null;

export async function POST(request: Request) {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ message: "Stripe webhook no configurado." }, { status: 500 });
    }

    const body = await request.text();
    const signature = (await headers()).get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ message: "Missing signature." }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    assertAdminSdk();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const query = await adminDb!
        .collection("deposits")
        .where("stripeSessionId", "==", session.id)
        .limit(1)
        .get();

      if (!query.empty) {
        const depositRef = query.docs[0].ref;
        const deposit = query.docs[0].data();
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
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Webhook error." },
      { status: 400 }
    );
  }
}
