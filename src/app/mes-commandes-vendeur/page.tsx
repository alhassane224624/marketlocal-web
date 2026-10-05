"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, PackageCheck, ReceiptText, Truck } from "lucide-react";
import api from "@/lib/axios";
import { itemsTotal, shopStatut } from "@/lib/orders";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, apiError, Avatar, Button, Card, EmptyState, formatDate, LoadingRows, money, PageHeader, Segmented, StatusBadge } from "@/components/ui";

interface ShopOrder {
  id: number;
  statut: string;
  created_at: string;
  ville_livraison?: string | null;
  buyer: { name: string; email: string };
  items: { id: number; quantite: number; statut: string; prix_unitaire: string; product: { nom: string } }[];
}

const filters = [
  { value: null, label: "Toutes" },
  { value: "payee", label: "À expédier" },
  { value: "expediee", label: "Expédiées" },
  { value: "livree", label: "Livrées" },
  { value: "en_attente", label: "Non payées" },
];

export default function MesCommandesVendeurPage() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .get("/shop/orders")
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: number, statut: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      await api.put(`/orders/${id}/statut`, { statut });
      await load();
    } catch (err) {
      setError(apiError(err, "Erreur lors de la mise à jour du statut."));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter ? orders.filter((o) => shopStatut(o) === filter) : orders;

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Espace vendeur" title="Commandes reçues" description="Préparez, expédiez puis confirmez la livraison de vos articles." />

      {!loading && orders.length > 0 && (
        <div className="mb-6">
          <Segmented
            options={filters.map((f) => ({ ...f, count: f.value ? orders.filter((o) => shopStatut(o) === f.value).length : orders.length }))}
            value={filter}
            onChange={setFilter}
          />
        </div>
      )}

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingRows />
      ) : orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Aucune commande pour l’instant" description="Les commandes contenant vos produits apparaîtront ici." />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-300 p-10 text-center text-sm text-ink-500">Aucune commande dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const statut = shopStatut(order);
            return (
              <Card key={order.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <Avatar name={order.buyer.name} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/commandes/${order.id}`} className="font-display text-lg font-semibold text-ink-900 hover:text-terra-700">
                          Commande #{order.id}
                        </Link>
                        <StatusBadge status={statut} />
                      </div>
                      <p className="mt-0.5 text-sm text-ink-500">
                        {order.buyer.name} · {formatDate(order.created_at)}
                        {order.ville_livraison && (
                          <span className="ml-2 inline-flex items-center gap-1"><MapPin size={13} />{order.ville_livraison}</span>
                        )}
                      </p>
                      <p className="mt-2 text-sm text-ink-700">{order.items.map((i) => `${i.product.nom} ×${i.quantite}`).join(" · ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 lg:justify-end">
                    <p className="font-display text-xl font-semibold tabular-nums">{money(itemsTotal(order))}</p>
                    {statut === "payee" && (
                      <Button onClick={() => updateStatus(order.id, "expediee")} loading={updatingId === order.id}>
                        <Truck size={16} /> Marquer expédiée
                      </Button>
                    )}
                    {statut === "expediee" && (
                      <Button variant="success" onClick={() => updateStatus(order.id, "livree")} loading={updatingId === order.id}>
                        <PackageCheck size={16} /> Marquer livrée
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
