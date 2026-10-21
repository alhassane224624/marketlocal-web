"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, Banknote, CreditCard, ReceiptText, RotateCcw } from "lucide-react";
import api from "@/lib/axios";
import type { Delivery } from "@/lib/deliveries";
import DashboardLayout from "@/components/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { Alert, apiError, Button, Card, cn, EmptyState, formatDate, LoadingRows, money, PageHeader, SearchInput, Segmented, StatusBadge } from "@/components/ui";

interface Order {
  id: number;
  statut: string;
  total: string;
  mode_paiement?: "carte" | "livraison";
  created_at: string;
  items: { id: number; quantite: number; prix_unitaire: string; product: { nom: string } }[];
  buyer: { id: number; name: string; email: string } | null;
  deliveries?: Delivery[];
}

const filters = [
  { value: null, label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "payee", label: "Payées" },
  { value: "expediee", label: "Expédiées" },
  { value: "livree", label: "Livrées" },
  { value: "annulee", label: "Annulées" },
];

// Litige ouvert ou résolu sur une course de la commande.
const hasDispute = (o: Order) => (o.deliveries || []).some((d) => d.probleme_signale_at);

const modes = [
  { value: "tous", label: "Tous paiements" },
  { value: "carte", label: "Carte" },
  { value: "livraison", label: "À la livraison" },
  { value: "litige", label: "Avec litige" },
] as const;

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refunding, setRefunding] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [mode, setMode] = useState<"tous" | "carte" | "livraison" | "litige">("tous");
  const [confirm, confirmDialog] = useConfirm();

  const load = () =>
    api
      .get("/admin/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));

  useEffect(() => {
    load();
  }, []);

  const refund = async (order: Order) => {
    const ok = await confirm({
      title: `Rembourser la commande #${order.id} ?`,
      description: (
        <>
          Le client <strong>{order.buyer?.name || "—"}</strong> sera remboursé de <strong>{money(order.total)}</strong> sur sa carte. Les montants déjà
          versés aux vendeurs seront repris. Cette action est définitive.
        </>
      ),
      confirmLabel: "Rembourser",
      tone: "danger",
    });
    if (!ok) return;
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

  // Commande non payée (carte en attente) ou colis refusé à la livraison : stock restitué.
  const canCancel = (o: Order) => o.statut === "en_attente" || (o.mode_paiement === "livraison" && o.statut === "expediee");

  const cancel = async (order: Order) => {
    const ok = await confirm({
      title: `Annuler la commande #${order.id} ?`,
      description: "Les articles sont remis en stock et la commande ne pourra plus être expédiée. Cette action est définitive.",
      confirmLabel: "Annuler la commande",
      cancelLabel: "Retour",
      tone: "danger",
    });
    if (!ok) return;
    setRefunding(order.id);
    setMessage(null);
    try {
      await api.put(`/orders/${order.id}/statut`, { statut: "annulee" });
      setMessage({ tone: "success", text: `Commande #${order.id} annulée.` });
      await load();
    } catch (err) {
      setMessage({ tone: "error", text: apiError(err, "Annulation impossible.") });
    } finally {
      setRefunding(null);
    }
  };

  const list = useMemo(() => orders || [], [orders]);
  const filtered = useMemo(
    () =>
      list.filter(
        (o) =>
          (filter === null || o.statut === filter) &&
          (mode === "tous" ||
            (mode === "litige" ? hasDispute(o) : mode === "livraison" ? o.mode_paiement === "livraison" : o.mode_paiement !== "livraison")) &&
          `${o.id} ${o.buyer?.name} ${o.buyer?.email} ${o.items.map((i) => i.product.nom).join(" ")}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [list, filter, mode, q],
  );
  const filteredTotal = filtered.filter((o) => o.statut !== "annulee").reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <DashboardLayout>
      {confirmDialog}
      <PageHeader eyebrow="Administration" title="Commandes" description="Toutes les commandes de la plateforme, avec remboursement en cas de litige." />

      <div className="mb-6 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Segmented options={filters.map((f) => ({ ...f, count: f.value ? list.filter((o) => o.statut === f.value).length : list.length }))} value={filter} onChange={setFilter} />
        <SearchInput value={q} onChange={setQ} placeholder="N°, client, produit…" />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-semibold transition",
                mode === m.value ? "bg-terra-50 text-terra-800 ring-1 ring-terra-300" : "text-ink-600 hover:bg-sand-100",
              )}
            >
              {m.label}
              {m.value === "litige" && ` (${list.filter(hasDispute).length})`}
            </button>
          ))}
        </div>
        {orders !== null && (
          <p className="text-sm text-ink-500">
            {filtered.length} commande{filtered.length > 1 ? "s" : ""} · <span className="font-semibold text-ink-800 tabular-nums">{money(filteredTotal)}</span> hors annulées
          </p>
        )}
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
                      {(o.deliveries || []).filter((d) => d.probleme_signale_at).map((d) => (
                        <p key={d.id} className="mt-1 text-xs font-semibold text-red-700" title={d.probleme_signale || undefined}>
                          Litige : « {d.probleme_signale} »
                        </p>
                      ))}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.statut} />
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                        {o.mode_paiement === "livraison" ? <><Banknote size={12} /> À la livraison</> : <><CreditCard size={12} /> Carte</>}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{money(o.total)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {canCancel(o) && (
                        <Button size="sm" variant="outline" onClick={() => cancel(o)} loading={refunding === o.id}>
                          <Ban size={13} /> Annuler
                        </Button>
                      )}
                      {o.statut === "payee" && o.mode_paiement !== "livraison" && (
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
