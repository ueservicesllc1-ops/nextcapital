import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { adminDb, assertAdminSdk } from "@/lib/firebase/admin";
import { requireVerifiedAuth } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireVerifiedAuth(request);
    const formData = await request.formData();
    const amount = Number(formData.get("amount"));
    const depositDate = String(formData.get("depositDate") ?? "");
    const receipt = formData.get("receipt") as File | null;

    if (!amount || !depositDate || !receipt) {
      return NextResponse.json({ message: "Datos incompletos para depósito manual." }, { status: 400 });
    }

    assertAdminSdk();

    let receiptUrl = "";
    let receiptPath = "";
    try {
      const buffer = Buffer.from(await receipt.arrayBuffer());
      const bucket = getStorage().bucket();
      const objectPath = `receipts/${uid}/${Date.now()}-${randomUUID()}-${receipt.name}`;
      const file = bucket.file(objectPath);
      await file.save(buffer, { contentType: receipt.type });
      receiptPath = objectPath;
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
      });
      receiptUrl = signedUrl;
    } catch {
      receiptUrl = "";
      receiptPath = "";
    }

    await adminDb!.collection("deposits").add({
      userId: uid,
      amount,
      method: "bank",
      status: "pending",
      bankName: "Banco Pichincha",
      createdAt: new Date().toISOString(),
      depositDate,
      receiptUrl,
      receiptPath,
    });

    return NextResponse.json({
      message: "Depósito bancario registrado con status pending.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo registrar el depósito." },
      { status: 500 }
    );
  }
}
