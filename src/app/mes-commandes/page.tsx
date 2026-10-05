"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { ButtonLink, Card, EmptyState, formatDate, LoadingRows, money, PageHeader, Segmented, StatusBadge } from "@/components/ui";

interface Order {
  id: number;
  statut: string;
  total: string;
  created_at: string;
  items: { id: number; quantite: number; prix_unitaire: string; product: { id: number; nom: string } }[];
}

const filters = [
  { value: null, label: "Toutes" },
  { value: "en_attente", label: "À payer" },
  { value: "payee", label: "Payées" },
  { value: "expediee", label: "Expédiées" },
  { value: "livree", label: "Livrées" },
  { value: "annulee", label: "Annulées" },
];

export default function MesCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/orders/mine")
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? orders.filter((o) => o.statut === filter) : orders;

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Espace acheteur" title="Mes commandes" description="Retrouvez vos achats et suivez leur livraison." />

      {!loading && orders.length > 0 && (
        <div className="mb-6">
          <Segmented
            options={filters.map((f) => ({ ...f, count: f.value ? orders.filter((o) => o.statut === f.value).length : orders.length }))}
            value={filter}
            onChange={setFilter}
          />
        </div>
      )}

      {loading ? (
        <LoadingRows />
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Aucune commande" description="Vous n’avez pas encore commandé." action={<ButtonLink href="/catalogue">Découvrir le catalogue</ButtonLink>} />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-300 p-10 text-center text-sm text-ink-500">Aucune commande dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id} className="transition hover:shadow-lift">
              <Link href={`/commandes/${order.id}`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-display text-lg font-semibold text-ink-900">Commande #{order.id}</p>
                    <StatusBadge status={order.statut} />
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {formatDate(order.created_at, true)} · {order.items.reduce((s, i) => s + i.quantite, 0)} article(s)
                  </p>
                  <p className="mt-2 line-clamp-1 text-sm text-ink-700">{order.items.map((i) => `${i.product.nom} ×${i.quantite}`).join(" · ")}</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  {order.statut === "en_attente" && <span className="text-sm font-semibold text-terra-700">Payer maintenant</span>}
                  <p className="font-display text-xl font-semibold tabular-nums">{money(order.total)}</p>
                  <ChevronRight size={18} className="text-ink-400" />
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
