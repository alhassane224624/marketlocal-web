"use client";

import { useState } from "react";
import { money } from "./ui";

export interface SalesPoint {
  date: string; // AAAA-MM-JJ
  value: number;
}

interface OrderLike {
  statut: string;
  created_at: string;
  total?: string | number;
  items?: { quantite: number; prix_unitaire: string | number }[];
}

const PAID = ["payee", "expediee", "livree"];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Ventes payées par jour sur les `days` derniers jours.
 * useItems : somme des lignes (vendeur, qui ne voit que ses articles) ; sinon total de la commande (admin).
 */
export function salesByDay(orders: OrderLike[], days = 30, useItems = true): SalesPoint[] {
  const today = new Date();
  const points: SalesPoint[] = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    index.set(dayKey(d), points.length);
    points.push({ date: dayKey(d), value: 0 });
  }
  for (const order of orders) {
    if (!PAID.includes(order.statut)) continue;
    const i = index.get(dayKey(new Date(order.created_at)));
    if (i === undefined) continue;
    points[i].value += useItems
      ? (order.items || []).reduce((s, item) => s + Number(item.prix_unitaire) * item.quantite, 0)
      : Number(order.total || 0);
  }
  return points;
}

const shortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** Histogramme d'une seule série : colonnes fines, grille discrète, info-bulle au survol. */
export default function SalesChart({ points, label }: { points: SalesPoint[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...points.map((p) => p.value), 0);
  // Échelle arrondie pour des graduations lisibles.
  const step = max <= 0 ? 100 : Math.pow(10, Math.floor(Math.log10(max)));
  const top = max <= 0 ? 300 : Math.ceil(max / step) * step;
  const ticks = [top, top * 0.75, top * 0.5, top * 0.25, 0];
  const total = points.reduce((s, p) => s + p.value, 0);

  return (
    <figure className="m-0">
      <div className="flex gap-3">
        {/* Axe Y */}
        <div className="flex h-48 flex-col justify-between pb-0 text-right text-[11px] tabular-nums text-ink-500" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {t >= 1000 ? `${String(Math.round(t / 100) / 10).replace(".", ",")} k` : Math.round(t)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Grille */}
          <div className="absolute inset-0 flex h-48 flex-col justify-between" aria-hidden>
            {ticks.map((t, i) => (
              <span key={t} className={i === ticks.length - 1 ? "border-t border-sand-300" : "border-t border-dashed border-sand-200"} />
            ))}
          </div>

          {/* Colonnes */}
          <div className="relative flex h-48 items-end gap-[2px]" onMouseLeave={() => setActive(null)} aria-hidden>
            {points.map((p, i) => (
              <div
                key={p.date}
                className="relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setActive(i)}
              >
                <div
                  className={`w-full max-w-[24px] rounded-t-[4px] transition-colors ${active === i ? "bg-terra-600" : "bg-terra-500"}`}
                  style={{ height: p.value > 0 ? `${Math.max((p.value / top) * 100, 1.5)}%` : 0 }}
                />
                {active === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs text-sand-50 shadow-lift">
                    <span className="block text-sand-300">{shortDate(p.date)}</span>
                    <span className="font-semibold tabular-nums">{money(p.value)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Axe X : une date par semaine */}
          <div className="mt-2 flex text-[11px] text-ink-500" aria-hidden>
            {points.map((p, i) => (
              <span key={p.date} className="flex flex-1 justify-center whitespace-nowrap">
                {i % 7 === 0 ? shortDate(p.date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        {label} : {money(total)} sur {points.length} jours.
      </figcaption>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Jour</th>
            <th scope="col">Montant</th>
          </tr>
        </thead>
        <tbody>
          {points
            .filter((p) => p.value > 0)
            .map((p) => (
              <tr key={p.date}>
                <td>{shortDate(p.date)}</td>
                <td>{money(p.value)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}
