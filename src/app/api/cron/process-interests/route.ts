import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { normalizeDate } from "@/lib/firestore-client";

export const dynamic = "force-dynamic";

// Tasa diaria base (0.8% promedio = ~24% mensual)
const DAILY_RATE_BASE = 0.008;

export async function GET(request: NextRequest) {
  try {
    // 1. Validar seguridad vía Header
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    assertAdminSdk();
    const now = new Date();
    
    // 2. Obtener todos los balances con capital activo
    const balancesSnap = await adminDb!
      .collection("balances")
      .where("currentBalance", ">", 0)
      .get();

    const results = {
      processed: 0,
      credited: 0,
      errors: 0,
      details: [] as string[],
    };

    for (const doc of balancesSnap.docs) {
      results.processed++;
      const balance = doc.data();
      const userId = doc.id;

      try {
        // 3. Determinar la "Hora de Referencia"
        // Buscamos el primer depósito aprobado para este usuario
        const depositsSnap = await adminDb!
          .collection("deposits")
          .where("userId", "==", userId)
          .where("status", "==", "approved")
          .orderBy("createdAt", "asc")
          .limit(1)
          .get();

        let referenceDate: Date;
        if (!depositsSnap.empty) {
          referenceDate = new Date(normalizeDate(depositsSnap.docs[0].data().createdAt));
        } else {
          // Fallback al createdAt del usuario si no hay depósitos aprobados (raro pero posible)
          const userSnap = await adminDb!.collection("users").doc(userId).get();
          referenceDate = new Date(normalizeDate(userSnap.data()?.createdAt));
        }

        const lastCredit = balance.lastInterestCredit 
          ? new Date(balance.lastInterestCredit) 
          : referenceDate;

        // 4. Calcular cuántos días han pasado desde el último crédito
        const msSinceLast = now.getTime() - lastCredit.getTime();
        const daysSinceLast = Math.floor(msSinceLast / (1000 * 60 * 60 * 24));
        const DAILY_RATE_SIMPLE = 0.01; // 1% fijo diario

        if (daysSinceLast >= 1) {
          const batch = adminDb!.batch();
          let newTotalProfit = balance.totalProfit ?? 0;
          let newCurrentBalance = balance.currentBalance ?? 0;
          let lastDate = new Date(lastCredit);

          for (let i = 0; i < daysSinceLast; i++) {
            lastDate.setDate(lastDate.getDate() + 1);
            
            // Interés Simple: Siempre sobre el total depositado
            const profitAmount = Number((balance.totalDeposited * DAILY_RATE_SIMPLE).toFixed(2));

            if (profitAmount > 0) {
              newTotalProfit += profitAmount;
              newCurrentBalance += profitAmount;

              const trxRef = adminDb!.collection("transactions").doc();
              batch.set(trxRef, {
                userId,
                type: "profit",
                amount: profitAmount,
                status: "approved",
                description: `Rendimiento diario fijo (1.00%)`,
                createdAt: lastDate.toISOString(),
              });
            }
          }


          // Actualizar Balance
          batch.set(doc.ref, {
            totalProfit: newTotalProfit,
            currentBalance: newCurrentBalance,
            lastInterestCredit: lastDate.toISOString(),
            updatedAt: now.toISOString(),
          }, { merge: true });

          await batch.commit();
          results.credited++;
          results.details.push(`Usuario ${userId}: ${daysSinceLast} días acreditados`);
        }

      } catch (err) {
        results.errors++;
        console.error(`Error procesando intereses para ${userId}:`, err);
      }
    }

    return NextResponse.json({
      message: "Proceso de intereses completado.",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error en el cron." },
      { status: 500 }
    );
  }
}
