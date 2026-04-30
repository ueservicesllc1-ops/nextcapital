import { NextRequest } from "next/server";
import { adminAuth, adminDb, assertAdminSdk } from "@/lib/firebase/admin";

export async function requireAuth(request: NextRequest) {
  const bearer = request.headers.get("authorization");
  const token = bearer?.replace("Bearer ", "");
  if (!token) {
    throw new Error("Unauthorized");
  }

  assertAdminSdk();
  const decoded = await adminAuth!.verifyIdToken(token);
  return decoded;
}

export async function requireVerifiedAuth(request: NextRequest) {
  const decoded = await requireAuth(request);
  if (!decoded.email_verified) {
    throw new Error("Email no verificado.");
  }
  return decoded;
}

export async function requireAdmin(request: NextRequest) {
  const decoded = await requireAuth(request);
  if ((decoded as { role?: string }).role === "admin") {
    return decoded;
  }
  const doc = await adminDb!.collection("users").doc(decoded.uid).get();
  const role = doc.data()?.role;
  if (role !== "admin") {
    throw new Error("Forbidden");
  }
  return decoded;
}
