"use client";

import { useEffect, useState } from "react";
import { Coins, Package, Percent, ReceiptText, Trophy, Wallet } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import SalesChart, { salesByDay } from "@/components/SalesChart";
import { Alert, Card, CardHeader, LoadingRows, money, PageHeader, StatCard } from "@/components/ui";

interface Stats {
  produits_en_ligne: number;
  produits_en_rupture: number;
  total_commandes: number;
  commandes_en_cours: number;
  chiffre_affaires_brut: number;
  chiffre_affaires_net: number;
  chiffre_affaires_brut_30j: number;
  chiffre_affaires_net_30j: number;
  taux_commission: number;
}

interface ShopOrder {
  statut: string;
  created_at: string;
  items: { quantite: number; statut?: string; prix_unitaire: string; product: { nom: string } }[];
}

const PAID = ["payee", "expediee", "livree"];

export default function MesStatistiquesPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/shop/stats")
      .then((r) => setS(r.data))
      .catch(() => setError("Impossible de charger les statistiques."));
    api
      .get("/shop/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  }, []);

  const points = salesByDay(orders || []);

  // Meilleures ventes (montant brut des commandes payées).
  const byProduct = new Map<string, { value: number; qty: number }>();
  for (const order of orders || []) {
    if (!PAID.includes(order.statut)) continue;
    for (const item of order.items) {
      const entry = byProduct.get(item.product.nom) || { value: 0, qty: 0 };
      entry.value += Number(item.prix_unitaire) * item.quantite;
      entry.qty += item.quantite;
      byProduct.set(item.product.nom, entry);
    }
  }
  const top = [...byProduct.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 5);
  const topMax = top[0]?.[1].value || 1;

  const commission = s ? s.chiffre_affaires_brut - s.chiffre_affaires_net : 0;

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Pilotage" title="Statistiques" description="Vos ventes payées, commission de la plateforme déduite." />
      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Ventes nettes (total)" value={money(s?.chiffre_affaires_net)} icon={Wallet} tone="terra" hint={s ? `${money(s.chiffre_affaires_brut)} brut` : undefined} />
        <StatCard label="Ventes nettes (30 j)" value={money(s?.chiffre_affaires_net_30j)} icon={Coins} tone="olive" hint={s ? `${money(s.chiffre_affaires_brut_30j)} brut` : undefined} />
        <StatCard label="Commission versée" value={money(commission)} icon={Percent} tone="ink" hint={s ? `Taux actuel ${s.taux_commission} %` : undefined} />
        <StatCard label="Commandes" value={s?.total_commandes ?? "—"} icon={ReceiptText} tone="sky" hint={s ? `${s.commandes_en_cours} en cours` : undefined} />
      </div>

      <Card className="mt-8">
        <CardHeader title="Ventes payées par jour" description="30 derniers jours, montant brut" />
        <div className="p-5">{orders === null ? <LoadingRows rows={2} /> : <SalesChart points={points} label="Ventes payées par jour" />}</div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Meilleures ventes" icon={Trophy} description="Par montant encaissé" />
          <div className="p-5">
            {orders === null ? (
              <LoadingRows rows={3} />
            ) : top.length === 0 ? (
              <p className="text-sm text-ink-500">Pas encore de vente payée.</p>
            ) : (
              <ol className="space-y-4">
                {top.map(([nom, { value, qty }]) => (
                  <li key={nom}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-ink-900">{nom}</span>
                      <span className="shrink-0 tabular-nums text-ink-700">{money(value)} <span className="text-ink-500">· {qty} vendu{qty > 1 ? "s" : ""}</span></span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand-100">
                      <div className="h-full rounded-full bg-terra-500" style={{ width: `${(value / topMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Catalogue" icon={Package} />
          <dl className="grid grid-cols-2 gap-px bg-sand-100">
            {[
              { label: "Produits en ligne", value: s?.produits_en_ligne ?? "—" },
              { label: "En rupture", value: s?.produits_en_rupture ?? "—" },
              { label: "Commandes en cours", value: s?.commandes_en_cours ?? "—" },
              { label: "Articles vendus", value: orders ? [...byProduct.values()].reduce((sum, p) => sum + p.qty, 0) : "—" },
            ].map((item) => (
              <div key={item.label} className="bg-white p-5">
                <dt className="text-sm text-ink-500">{item.label}</dt>
                <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </DashboardLayout>
  );
}
