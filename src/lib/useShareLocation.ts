"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import api from "@/lib/axios";

export type LocationStatus = "inactive" | "waiting" | "sharing" | "denied" | "unavailable";

const SEND_EVERY_MS = 15000;

const noSubscribe = () => () => {};

/**
 * Partage la position GPS du livreur pour ses courses en cours (acceptées ou en route).
 * Le navigateur demande l'autorisation ; la position n'est envoyée que toutes les 15 s.
 * Fonctionne en HTTPS (Vercel) et sur localhost.
 */
export function useShareLocation(deliveryIds: number[]): LocationStatus {
  // Côté serveur on suppose le GPS disponible : le client corrige après l'hydratation.
  const supported = useSyncExternalStore(noSubscribe, () => Boolean(navigator.geolocation), () => true);
  // Statut remonté par le GPS, rattaché à la liste de courses qui l'a produit :
  // si la liste change, l'ancien statut est ignoré (on repasse à « waiting »).
  const [watched, setWatched] = useState<{ key: string; status: LocationStatus } | null>(null);
  const lastSent = useRef(0);
  const key = deliveryIds.join(",");

  useEffect(() => {
    if (deliveryIds.length === 0 || !supported) return;

    lastSent.current = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setWatched({ key, status: "sharing" });
        const now = Date.now();
        if (now - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = now;
        const body = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        deliveryIds.forEach((id) => api.post(`/livraisons/${id}/position`, body).catch(() => {}));
      },
      (err) => setWatched({ key, status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable" }),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, supported]);

  if (deliveryIds.length === 0) return "inactive";
  if (!supported) return "unavailable";
  return watched?.key === key ? watched.status : "waiting";
}
