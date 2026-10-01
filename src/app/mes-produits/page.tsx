"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMyShop } from "@/features/shop/shopSlice";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Pencil, Trash2, Plus, Search, Package } from "lucide-react";

interface Product {
  id: number;
  nom: string;
  prix: string;
  stock: number;
  image: string | null;
  category: { id: number; nom: string };
}

export default function MesProduitsPage() {
  const dispatch = useAppDispatch();
  const { shop } = useAppSelector((state) => state.shop);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadShop = async () => {
    setLoading(true);
    const result = await dispatch(fetchMyShop());
    if (fetchMyShop.fulfilled.match(result)) {
      setProducts(result.payload.products || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce produit ?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  if (!shop && !loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-500">
          Vous devez d'abord créer une boutique.{" "}
          <Link href="/shop/create" className="text-green-600 hover:underline">
            Créer ma boutique
          </Link>
        </p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-800">Mes produits</h1>
        <Link
          href="/mes-produits/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus size={16} />
          Ajouter un produit
        </Link>
      </div>
      <p className="text-gray-500 mb-6">Gérez vos produits et votre stock</p>

      {/* Barre de recherche */}
      <div className="relative w-80 max-w-full mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {loading && (
        <p className="text-gray-500 text-center py-12">Chargement...</p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-gray-500">
            {search ? "Aucun produit ne correspond à votre recherche." : "Aucun produit ajouté pour le moment."}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-medium">Image</th>
                <th className="px-5 py-3 font-medium">Nom du produit</th>
                <th className="px-5 py-3 font-medium">Prix</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={18} className="text-gray-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{product.nom}</p>
                    <p className="text-xs text-gray-400">{product.category.nom}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-700">
                    {parseFloat(product.prix).toFixed(2)} MAD
                  </td>
                  <td className="px-5 py-3 text-gray-600">{product.stock}</td>
                  <td className="px-5 py-3">
                    {product.stock > 0 ? (
                      <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                        Actif
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                        En rupture
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/mes-produits/${product.id}`}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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