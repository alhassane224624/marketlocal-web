"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

export type LocationStatus = "inactive" | "waiting" | "sharing" | "denied" | "unavailable";

const SEND_EVERY_MS = 15000;

/**
 * Partage la position GPS du livreur pour ses courses en cours (acceptées ou en route).
 * Le navigateur demande l'autorisation ; la position n'est envoyée que toutes les 15 s.
 * Fonctionne en HTTPS (Vercel) et sur localhost.
 */
export function useShareLocation(deliveryIds: number[]): LocationStatus {
  const [status, setStatus] = useState<LocationStatus>("inactive");
  const lastSent = useRef(0);
  const key = deliveryIds.join(",");

  useEffect(() => {
    if (deliveryIds.length === 0) {
      setStatus("inactive");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("waiting");
    lastSent.current = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("sharing");
        const now = Date.now();
        if (now - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = now;
        const body = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        deliveryIds.forEach((id) => api.post(`/livraisons/${id}/position`, body).catch(() => {}));
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return status;
}
