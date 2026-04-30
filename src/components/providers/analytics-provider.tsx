"use client";

import { logEvent } from "firebase/analytics";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseAnalytics } from "@/lib/firebase/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  const pageLocation = useMemo(() => {
    const query = searchParams.toString();
    if (typeof window === "undefined") return pathname;
    return `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    let mounted = true;
    getFirebaseAnalytics()
      .then((analytics) => {
        if (!mounted || !analytics) return;
        setReady(true);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    getFirebaseAnalytics()
      .then((analytics) => {
        if (!analytics) return;
        logEvent(analytics, "page_view", {
          page_path: pathname,
          page_location: pageLocation,
        });
      })
      .catch(() => undefined);
  }, [pathname, pageLocation, ready]);

  return null;
}
