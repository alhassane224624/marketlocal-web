"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Carte OpenStreetMap (Leaflet, gratuit, sans clé API) avec la position du livreur.
 * Leaflet a besoin de `window` : il est chargé dans un effet, côté navigateur seulement.
 * Le marqueur est un divIcon (pas d'image) : les icônes par défaut de Leaflet ne sont
 * pas trouvées une fois le code empaqueté par Next.js.
 */
export default function LiveMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);

  // Création de la carte (une seule fois).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !container.current || map.current) return;

      map.current = L.map(container.current, { zoomControl: true, attributionControl: true }).setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; contributeurs OpenStreetMap",
      }).addTo(map.current);

      const icon = L.divIcon({
        className: "",
        html: '<span style="display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;background:#a74a23;color:#fff;border:3px solid #fff;box-shadow:0 4px 12px rgb(0 0 0/.3);font-size:16px">🛵</span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      marker.current = L.marker([lat, lng], { icon, title: label }).addTo(map.current);
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nouvelle position : on déplace le marqueur et on recentre en douceur.
  useEffect(() => {
    if (!map.current || !marker.current) return;
    marker.current.setLatLng([lat, lng]);
    map.current.panTo([lat, lng], { animate: true });
  }, [lat, lng]);

  return <div ref={container} className="h-64 w-full overflow-hidden rounded-2xl border border-sand-200" role="img" aria-label={label} />;
}
