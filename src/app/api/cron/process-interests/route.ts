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
          : null;

        // 4. ¿Ha pasado el ciclo de 24 horas?
        // El ciclo se cumple si:
        // - Nunca se ha acreditado Y ya pasó la hora de referencia hoy
        // - O han pasado más de 23.5 horas desde el último crédito (margen de error de cron)
        
        let shouldCredit = false;
        if (!lastCredit) {
          // Si nunca se ha acreditado, verificamos si ya pasó la hora hoy
          const todayTarget = new Date(now);
          todayTarget.setHours(referenceDate.getHours(), referenceDate.getMinutes(), referenceDate.getSeconds(), 0);
          if (now.getTime() >= todayTarget.getTime()) {
            shouldCredit = true;
          }
        } else {
          const hoursSinceLast = (now.getTime() - lastCredit.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLast >= 23.5) {
            shouldCredit = true;
          }
        }

        if (shouldCredit) {
          // 5. Calcular interés variable (0.7% a 0.9%)
          const fluctuation = (Math.random() * 0.002) - 0.001; // -0.1% a +0.1%
          const finalRate = DAILY_RATE_BASE + fluctuation;
          const profitAmount = Number((balance.currentBalance * finalRate).toFixed(2));

          if (profitAmount > 0) {
            const batch = adminDb!.batch();
            
            // Actualizar Balance
            batch.set(doc.ref, {
              totalProfit: (balance.totalProfit ?? 0) + profitAmount,
              currentBalance: (balance.currentBalance ?? 0) + profitAmount,
              lastInterestCredit: now.toISOString(),
              updatedAt: now.toISOString(),
            }, { merge: true });

            // Crear Transacción
            const trxRef = adminDb!.collection("transactions").doc();
            batch.set(trxRef, {
              userId,
              type: "profit",
              amount: profitAmount,
              status: "approved",
              description: `Rendimiento diario automatizado (${(finalRate * 100).toFixed(2)}%)`,
              createdAt: now.toISOString(),
            });

            await batch.commit();
            results.credited++;
            results.details.push(`Usuario ${userId}: +${profitAmount}`);
          }
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
