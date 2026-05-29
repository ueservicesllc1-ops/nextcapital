import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// PayPhone calls this URL when a transaction is approved or rejected
// Params received via GET: ?id=PAYPHONE_ID&clientTransactionId=NC-xxx-...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const payphoneId = searchParams.get('id');
    const clientTransactionId = searchParams.get('clientTransactionId');

    if (!payphoneId || !clientTransactionId) {
      return NextResponse.json({ error: 'Parámetros faltantes.' }, { status: 400 });
    }

    // Confirm the transaction status with PayPhone
    const confirmRes = await fetch(
      `https://pay.payphonetodoesposible.com/api/Sale?id=${payphoneId}&clientTransactionId=${clientTransactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYPHONE_TOKEN}`,
        },
      }
    );

    const confirmData = await confirmRes.json();
    console.log('[PayPhone Webhook] Confirmation data:', JSON.stringify(confirmData));

    // PayPhone statusCode: 1 = Approved, 2 = Cancelled, 3 = Rejected
    const approved = confirmData?.transactionStatus === 'Approved' || confirmData?.statusCode === 1;
    const rejected = confirmData?.statusCode === 3;
    const cancelled = confirmData?.statusCode === 2;

    const newStatus = approved ? 'approved' : (rejected || cancelled ? 'rejected' : 'pending');

    // Update the deposit in Firestore
    if (adminDb) {
      const depositsRef = adminDb.collection('deposits');
      const snapshot = await depositsRef
        .where('clientTransactionId', '==', clientTransactionId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        const depositData = snapshot.docs[0].data();

        await docRef.update({
          status: newStatus,
          payphoneConfirmData: confirmData,
          confirmedAt: new Date().toISOString(),
        });

        // If approved: credit to user balance
        if (approved && depositData.userId) {
          const balanceRef = adminDb.collection('balances').doc(depositData.userId);
          const balanceSnap = await balanceRef.get();

          if (balanceSnap.exists) {
            const current = balanceSnap.data()!;
            await balanceRef.update({
              totalDeposited: (current.totalDeposited ?? 0) + (depositData.amount ?? 0),
              currentBalance: (current.currentBalance ?? 0) + (depositData.amount ?? 0),
              updatedAt: new Date().toISOString(),
            });
          } else {
            await balanceRef.set({
              userId: depositData.userId,
              totalDeposited: depositData.amount ?? 0,
              totalProfit: 0,
              currentBalance: depositData.amount ?? 0,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } else {
        console.warn('[PayPhone Webhook] No deposit found for clientTransactionId:', clientTransactionId);
      }
    }

    // PayPhone expects an HTTP 200 response to confirm receipt
    return NextResponse.json({ received: true, status: newStatus }, { status: 200 });
  } catch (err: any) {
    console.error('[PayPhone Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

// Also handle POST in case PayPhone sends a POST webhook
export async function POST(req: NextRequest) {
  return GET(req);
}
