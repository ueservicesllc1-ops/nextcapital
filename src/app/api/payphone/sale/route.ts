import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// PayPhone API Sale endpoint
const PAYPHONE_API_URL = 'https://pay.payphonetodoesposible.com/api/Sale';
const PAYPHONE_TOKEN   = process.env.PAYPHONE_TOKEN!;
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, planId, phoneNumber, userId, userName, userEmail } = body;

    if (!amount || !planId || !phoneNumber || !userId) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // PayPhone amounts are in CENTS (multiply by 100)
    const amountCents = Math.round(amount * 100);

    // Unique transaction ID: userId + timestamp
    const clientTransactionId = `NC-${planId}-${userId.slice(0, 8)}-${Date.now()}`;

    // Base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace('http://localhost:3000', 'https://nextcapital-production.up.railway.app') 
      || 'https://nextcapital-production.up.railway.app';

    const payphonePayload = {
      phoneNumber: phoneNumber.replace(/\D/g, ''), // digits only
      countryCode: '593',                           // Ecuador
      amount: amountCents,
      amountWithoutTax: amountCents,                // No IVA on investment services
      clientTransactionId,
      reference: `Contrato Hashrate ${planId} — NextCapital`,
      storeId: PAYPHONE_STORE_ID,
      currency: 'USD',
      timeZone: -5,
      clientUserId: userId,
      optionalParameter1: planId,
      optionalParameter2: userId,
      optionalParameter3: userName || '',
      responseUrl: `${baseUrl}/api/payphone/webhook`,
    };

    const ppRes = await fetch(PAYPHONE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYPHONE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payphonePayload),
    });

    const ppData = await ppRes.json();

    if (!ppRes.ok) {
      console.error('[PayPhone] Error response:', ppData);
      return NextResponse.json(
        { message: ppData?.message || 'Error al crear la solicitud de pago en PayPhone.' },
        { status: ppRes.status }
      );
    }

    // Store pending deposit in Firestore
    if (adminDb) {
      await adminDb.collection('deposits').add({
        userId,
        amount,
        planId,
        status: 'pending',
        method: 'payphone',
        payphoneTransactionId: ppData.transactionId ?? null,
        clientTransactionId,
        phoneNumber,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      transactionId: ppData.transactionId,
      clientTransactionId,
      message: 'Solicitud de cobro enviada. El cliente recibirá una notificación en su app PayPhone.',
    });
  } catch (err: any) {
    console.error('[PayPhone] Unexpected error:', err);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
