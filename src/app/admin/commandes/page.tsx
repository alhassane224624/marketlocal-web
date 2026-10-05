"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ReceiptText, RotateCcw } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, apiError, Button, Card, EmptyState, formatDate, LoadingRows, money, PageHeader, SearchInput, Segmented, StatusBadge } from "@/components/ui";

interface Order {
  id: number;
  statut: string;
  total: string;
  created_at: string;
  items: { id: number; quantite: number; prix_unitaire: string; product: { nom: string } }[];
  buyer: { id: number; name: string; email: string } | null;
}

const filters = [
  { value: null, label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "payee", label: "Payées" },
  { value: "expediee", label: "Expédiées" },
  { value: "livree", label: "Livrées" },
  { value: "annulee", label: "Annulées" },
];

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refunding, setRefunding] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = () =>
    api
      .get("/admin/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));

  useEffect(() => {
    load();
  }, []);

  const refund = async (order: Order) => {
    if (!confirm(`Rembourser intégralement la commande #${order.id} (${money(order.total)}) ? Les montants déjà versés aux vendeurs seront repris.`)) return;
    setRefunding(order.id);
    setMessage(null);
    try {
      await api.post(`/admin/orders/${order.id}/rembourser`);
      setMessage({ tone: "success", text: `Commande #${order.id} remboursée.` });
      await load();
    } catch (err) {
      setMessage({ tone: "error", text: apiError(err, "Remboursement impossible.") });
    } finally {
      setRefunding(null);
    }
  };

  const list = useMemo(() => orders || [], [orders]);
  const filtered = useMemo(
    () =>
      list.filter(
        (o) => (filter === null || o.statut === filter) && `${o.id} ${o.buyer?.name} ${o.buyer?.email}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [list, filter, q],
  );

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Administration" title="Commandes" description="Toutes les commandes de la plateforme, avec remboursement en cas de litige." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented options={filters.map((f) => ({ ...f, count: f.value ? list.filter((o) => o.statut === f.value).length : list.length }))} value={filter} onChange={setFilter} />
        <SearchInput value={q} onChange={setQ} placeholder="N°, client, e-mail…" />
      </div>

      {message && <Alert tone={message.tone} className="mb-4">{message.text}</Alert>}

      {orders === null ? (
        <LoadingRows rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Aucune commande" description="Aucune commande ne correspond à ces critères." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-sand-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3 font-semibold">Commande</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Articles</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="transition hover:bg-sand-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/commandes/${o.id}`} className="font-semibold text-ink-900 hover:text-terra-700">#{o.id}</Link>
                      <p className="text-xs text-ink-500">{formatDate(o.created_at)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink-900">{o.buyer?.name || "—"}</p>
                      <p className="text-xs text-ink-500">{o.buyer?.email}</p>
                    </td>
                    <td className="max-w-[260px] px-5 py-3.5 text-ink-600">
                      <p className="line-clamp-2">{o.items.map((i) => `${i.product.nom} ×${i.quantite}`).join(", ")}</p>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.statut} /></td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{money(o.total)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {o.statut === "payee" && (
                        <Button size="sm" variant="danger" onClick={() => refund(o)} loading={refunding === o.id}>
                          <RotateCcw size={13} /> Rembourser
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
