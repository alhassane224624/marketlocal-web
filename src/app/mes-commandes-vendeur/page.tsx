"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart } from "lucide-react";

interface ShopOrder {
  id: number;
  statut: string;
  created_at: string;
  buyer: { name: string; email: string };
  items: {
    id: number;
    quantite: number;
    prix_unitaire: string;
    product: { nom: string };
  }[];
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

const filters = [
  { key: null, label: "Toutes" },
  { key: "payee", label: "À expédier" },
  { key: "expediee", label: "Expédiées" },
  { key: "livree", label: "Livrées" },
  { key: "en_attente", label: "En attente" },
];

export default function MesCommandesVendeurPage() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
    try {
      await api.put(`/orders/${id}/statut`, { statut });
      await load();
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter ? orders.filter((o) => o.statut === filter) : orders;

  const totalOf = (o: ShopOrder) =>
    o.items.reduce((sum, i) => sum + parseFloat(i.prix_unitaire) * i.quantite, 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Commandes</h1>
      <p className="text-gray-500 mb-6">Suivez et traitez les commandes de votre boutique</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f.key
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-center py-12">Chargement...</p>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <ShoppingCart className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-gray-500">Aucune commande dans cette catégorie.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-medium">Commande</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Articles</th>
                <th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">#{order.id}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-gray-800">{order.buyer.name}</p>
                    <p className="text-xs text-gray-400">{order.buyer.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {order.items.map((i) => `${i.product.nom} ×${i.quantite}`).join(", ")}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-700">
                    {totalOf(order).toFixed(2)} MAD
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statutColors[order.statut]}`}>
                      {statutLabels[order.statut]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {order.statut === "payee" && (
                      <button
                        onClick={() => updateStatus(order.id, "expediee")}
                        disabled={updatingId === order.id}
                        className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition"
                      >
                        Marquer expédiée
                      </button>
                    )}
                    {order.statut === "expediee" && (
                      <button
                        onClick={() => updateStatus(order.id, "livree")}
                        disabled={updatingId === order.id}
                        className="px-3 py-1.5 text-xs border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50 rounded-lg transition"
                      >
                        Marquer livrée
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}