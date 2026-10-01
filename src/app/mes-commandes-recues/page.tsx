"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, money } from "@/components/MarketLocalUI";

interface OrderItem {
  id: number;
  quantite: number;
  prix_unitaire: string;
  product: { id: number; nom: string };
}

interface Order {
  id: number;
  statut: string;
  total: string;
  created_at: string;
  items: OrderItem[];
  buyer: { id: number; name: string; email: string };
}

const statutLabels: Record<string, string> = {
  en_attente: "En attente de paiement",
  payee: "Payée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

const statutColors: Record<string, string> = {
  en_attente: "bg-yellow-100 text-yellow-700",
  payee: "bg-blue-100 text-blue-700",
  expediee: "bg-purple-100 text-purple-700",
  livree: "bg-green-100 text-green-700",
  annulee: "bg-red-100 text-red-700",
};

// Prochaine étape logique dans le cycle de vie d'une commande.
// null = statut final, aucune action proposée (livree, annulee).
const nextStatut: Record<string, string | null> = {
  en_attente: null,
  payee: "expediee",
  expediee: "livree",
  livree: null,
  annulee: null,
};

const nextActionLabel: Record<string, string> = {
  payee: "Marquer comme payée",
  expediee: "Marquer comme expédiée",
  livree: "Marquer comme livrée",
};

export default function MesCommandesRecuesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get("/shop/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Impossible de charger les commandes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateStatus = async (orderId: number, statut: string) => {
    setUpdatingId(orderId);
    setError(null);
    try {
      await api.put(`/orders/${orderId}/statut`, { statut });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, statut } : o))
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de la mise à jour du statut."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = (orderId: number) => {
    if (!confirm("Annuler cette commande ?")) return;
    handleUpdateStatus(orderId, "annulee");
  };

  const filtered = filter ? orders.filter((o) => o.statut === filter) : orders;

  const enCoursCount = orders.filter((o) =>
    ["en_attente", "payee", "expediee"].includes(o.statut)
  ).length;

  return (
    <DashboardLayout>
      <div className="mb-7"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-green-600">Vendeur</p><h1 className="mt-1 text-3xl font-black">Commandes reçues</h1><p className="mt-1 text-sm text-slate-500">Traitez les commandes de votre boutique.</p></div>
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">{filters.map(f=><button key={String(f.key)} onClick={()=>setFilter(f.key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold ${filter===f.key?"bg-white text-slate-900 shadow-sm":"text-slate-500"}`}>{f.label}</button>)}</div>
      {error&&<div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</div>}
      {loading?<div className="rounded-2xl bg-white p-12 text-center text-xs text-slate-400">Chargement...</div>:filtered.length===0?<div className="rounded-2xl bg-white p-12 text-center text-xs text-slate-400">Aucune commande.</div>:<div className="space-y-3">{filtered.map(order=><div key={order.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold">Commande #{order.id}</p><StatusBadge status={order.statut}/></div><p className="mt-1 text-xs text-slate-500">{order.buyer.name} · {order.buyer.email}</p><p className="mt-2 text-[11px] text-slate-400">{order.items.map(i=>`${i.product.nom} ×${i.quantite}`).join(", ")}</p></div><div className="flex items-center gap-3"><p className="text-base font-black">{money(order.total)}</p>{nextStatut[order.statut]&&<button disabled={updatingId===order.id} onClick={()=>handleUpdateStatus(order.id,nextStatut[order.statut]!)} className="rounded-xl bg-green-600 px-3 py-2 text-[11px] font-bold text-white disabled:bg-slate-200">{updatingId===order.id?"...":nextActionLabel[nextStatut[order.statut]!]}</button>}</div></div></div>)}</div>}
    </DashboardLayout>
  );

}