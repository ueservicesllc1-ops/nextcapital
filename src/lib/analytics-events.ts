"use client";

import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/lib/firebase/analytics";

export async function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics) return;
    logEvent(analytics, name, params);
  } catch {
    // Ignore analytics failures to avoid impacting UX.
  }
}
