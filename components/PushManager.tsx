"use client";

import { useEffect, useRef } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Registers the push service worker and, once the member has granted
 * notification permission, subscribes this browser for background pushes.
 * Renders nothing. Safe no-op when VAPID keys aren't configured server-side.
 */
export default function PushManager() {
  const done = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    async function ensureSubscribed() {
      if (done.current || cancelled) return;
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const res = await fetch("/api/lms/push");
        const { publicKey } = await res.json();
        if (!publicKey) return; // push not configured on the server yet

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
          });
        }
        await fetch("/api/lms/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
        done.current = true;
      } catch {
        /* registration/subscription failed — bell still polls in-app */
      }
    }

    // Register the SW immediately so it's ready, then try to subscribe.
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    ensureSubscribed();

    // The bell requests permission on click; re-attempt when the user returns
    // to the tab or briefly poll until permission is granted.
    const onVis = () => { if (document.visibilityState === "visible") ensureSubscribed(); };
    document.addEventListener("visibilitychange", onVis);
    const iv = setInterval(() => {
      if (done.current) { clearInterval(iv); return; }
      ensureSubscribed();
    }, 4000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(iv);
    };
  }, []);

  return null;
}
