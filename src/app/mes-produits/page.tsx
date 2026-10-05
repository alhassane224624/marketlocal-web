"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Pencil, Plus, Search, Store, Trash2 } from "lucide-react";
import { useAppDispatch } from "@/lib/hooks";
import { fetchMyShop } from "@/features/shop/shopSlice";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { ProductVisual } from "@/components/MarketLocalUI";
import { Alert, apiError, Badge, ButtonLink, Card, EmptyState, LoadingRows, money, PageHeader, Segmented } from "@/components/ui";

interface Product {
  id: number;
  nom: string;
  prix: string;
  stock: number;
  image: string | null;
  category: { id: number; nom: string } | null;
}

type StockFilter = "all" | "low" | "out";

export default function MesProduitsPage() {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [hasShop, setHasShop] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(fetchMyShop()).then((result) => {
      if (fetchMyShop.fulfilled.match(result)) setProducts(result.payload.products || []);
      else setHasShop(false);
      setLoading(false);
    });
  }, [dispatch]);

  const remove = async (product: Product) => {
    if (!confirm(`Supprimer « ${product.nom} » ? Les commandes passées restent consultables.`)) return;
    setDeletingId(product.id);
    setError("");
    try {
      await api.delete(`/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(apiError(err, "Erreur lors de la suppression."));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products
    .filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => (stockFilter === "out" ? p.stock === 0 : stockFilter === "low" ? p.stock > 0 && p.stock < 5 : true));

  if (!loading && !hasShop) {
    return (
      <DashboardLayout>
        <PageHeader eyebrow="Espace vendeur" title="Mes produits" />
        <EmptyState icon={Store} title="Créez d’abord votre boutique" action={<ButtonLink href="/shop/create">Créer ma boutique</ButtonLink>} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Espace vendeur"
        title="Mes produits"
        description={`${products.length} produit${products.length > 1 ? "s" : ""} dans votre boutique.`}
        actions={
          <ButtonLink href="/mes-produits/nouveau">
            <Plus size={16} /> Ajouter un produit
          </ButtonLink>
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingRows rows={4} />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="Aucun produit" description="Ajoutez votre premier produit pour apparaître dans le catalogue." action={<ButtonLink href="/mes-produits/nouveau">Ajouter un produit</ButtonLink>} />
      ) : (
        <Card>
          <div className="flex flex-col gap-3 border-b border-sand-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block sm:w-72">
              <span className="sr-only">Rechercher</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                className="h-10 w-full rounded-xl border border-sand-300 bg-white pl-9 pr-3 text-sm focus:border-terra-400 focus:outline-none focus:ring-4 focus:ring-terra-100"
              />
            </label>
            <Segmented<StockFilter>
              options={[
                { value: "all", label: "Tous", count: products.length },
                { value: "low", label: "Stock faible", count: products.filter((p) => p.stock > 0 && p.stock < 5).length },
                { value: "out", label: "Épuisés", count: products.filter((p) => p.stock === 0).length },
              ]}
              value={stockFilter}
              onChange={setStockFilter}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-500">Aucun produit ne correspond.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-sand-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    <th className="px-5 py-3 font-semibold">Produit</th>
                    <th className="px-5 py-3 font-semibold">Catégorie</th>
                    <th className="px-5 py-3 text-right font-semibold">Prix</th>
                    <th className="px-5 py-3 font-semibold">Stock</th>
                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="transition hover:bg-sand-50">
                      <td className="px-5 py-3">
                        <Link href={`/mes-produits/${p.id}`} className="flex items-center gap-3">
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                            <ProductVisual product={p} />
                          </span>
                          <span className="font-semibold text-ink-900 hover:text-terra-700">{p.nom}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-600">{p.category?.nom || "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{money(p.prix)}</td>
                      <td className="px-5 py-3">
                        {p.stock === 0 ? (
                          <Badge tone="red">Épuisé</Badge>
                        ) : p.stock < 5 ? (
                          <Badge tone="saffron">{p.stock} restants</Badge>
                        ) : (
                          <span className="tabular-nums text-ink-700">{p.stock}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/mes-produits/${p.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900" aria-label={`Modifier ${p.nom}`}>
                            <Pencil size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => remove(p)}
                            disabled={deletingId === p.id}
                            className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                            aria-label={`Supprimer ${p.nom}`}
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
        </Card>
      )}
    </DashboardLayout>
  );
}
