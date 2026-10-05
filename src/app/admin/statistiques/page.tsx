"use client";

import { useEffect, useState } from "react";
import { Coins, Package, Percent, ReceiptText, Store, Users } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import SalesChart, { salesByDay } from "@/components/SalesChart";
import { Alert, Card, CardHeader, LoadingRows, money, PageHeader, StatCard, StatusBadge } from "@/components/ui";

interface Stats {
  total_utilisateurs: number;
  total_acheteurs: number;
  total_vendeurs: number;
  total_boutiques: number;
  boutiques_en_attente: number;
  total_produits: number;
  total_commandes: number;
  chiffre_affaires_total: number;
  commissions_total?: number;
}

interface Order {
  statut: string;
  total: string;
  created_at: string;
}

const statuses = ["en_attente", "payee", "expediee", "livree", "annulee"];

export default function AdminStatistiquesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(() => setError("Impossible de charger les statistiques."));
    api
      .get("/admin/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  }, []);

  const points = salesByDay(orders || [], 30, false);
  const byStatus = statuses.map((s) => ({ statut: s, count: (orders || []).filter((o) => o.statut === s).length }));
  const maxStatus = Math.max(...byStatus.map((s) => s.count), 1);
  const paidCount = (orders || []).filter((o) => ["payee", "expediee", "livree"].includes(o.statut)).length;
  const takeRate = stats && stats.chiffre_affaires_total ? ((stats.commissions_total || 0) / stats.chiffre_affaires_total) * 100 : 0;

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Administration" title="Statistiques" description="Ventes, commissions et activité de la marketplace." />
      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Chiffre d’affaires" value={money(stats?.chiffre_affaires_total)} icon={Coins} tone="terra" hint="Commandes payées" />
        <StatCard label="Commissions" value={money(stats?.commissions_total)} icon={Percent} tone="olive" hint={stats ? `${takeRate.toFixed(1).replace(".", ",")} % du chiffre d’affaires` : undefined} />
        <StatCard label="Panier moyen" value={paidCount ? money((stats?.chiffre_affaires_total || 0) / paidCount) : "—"} icon={ReceiptText} tone="sky" hint={`${paidCount} commande(s) payée(s)`} />
        <StatCard label="Produits" value={stats?.total_produits ?? "—"} icon={Package} tone="saffron" />
      </div>

      <Card className="mt-8">
        <CardHeader title="Ventes payées par jour" description="30 derniers jours, total des commandes" />
        <div className="p-5">{orders === null ? <LoadingRows rows={2} /> : <SalesChart points={points} label="Ventes payées par jour" />}</div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Commandes par statut" icon={ReceiptText} description={`${stats?.total_commandes ?? 0} commandes au total`} />
          <ul className="space-y-4 p-5">
            {byStatus.map(({ statut, count }) => (
              <li key={statut} className="grid grid-cols-[110px_1fr_32px] items-center gap-3">
                <StatusBadge status={statut} />
                <div className="h-2 overflow-hidden rounded-full bg-sand-100">
                  <div className="h-full rounded-full bg-ink-700" style={{ width: `${(count / maxStatus) * 100}%` }} />
                </div>
                <span className="text-right text-sm font-semibold tabular-nums text-ink-800">{count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Communauté" icon={Users} />
          <dl className="grid grid-cols-2 gap-px bg-sand-100">
            {[
              { label: "Acheteurs", value: stats?.total_acheteurs, icon: Users },
              { label: "Vendeurs", value: stats?.total_vendeurs, icon: Store },
              { label: "Boutiques", value: stats?.total_boutiques, icon: Store },
              { label: "Boutiques à valider", value: stats?.boutiques_en_attente, icon: Store },
            ].map((item) => (
              <div key={item.label} className="bg-white p-5">
                <dt className="text-sm text-ink-500">{item.label}</dt>
                <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink-900">{item.value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </DashboardLayout>
  );
}
