"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, Minus, Package, Pencil, Plus, Search, Store, Trash2 } from "lucide-react";
import { useAppDispatch } from "@/lib/hooks";
import { fetchMyShop } from "@/features/shop/shopSlice";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { ProductVisual } from "@/components/MarketLocalUI";
import { Alert, apiError, Badge, ButtonLink, Card, cn, EmptyState, LoadingRows, money, PageHeader, Segmented } from "@/components/ui";

interface Product {
  id: number;
  nom: string;
  prix: string;
  stock: number;
  en_vente?: boolean;
  image: string | null;
  category: { id: number; nom: string } | null;
}

type StockFilter = "all" | "low" | "out" | "off";

const isOnSale = (p: Product) => p.en_vente !== false;

/** Stock modifiable sur place : − / + ou saisie, puis Entrée ou ✓ pour enregistrer. */
function StockEditor({ product, onSaved, onError }: { product: Product; onSaved: (stock: number) => void; onError: (message: string) => void }) {
  const [draft, setDraft] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const value = Math.max(0, Math.floor(Number(draft) || 0));
  const dirty = draft !== "" && value !== product.stock;

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await api.put(`/products/${product.id}`, { stock: value });
      onSaved(value);
      setDraft(String(value));
    } catch (err) {
      onError(apiError(err, "Impossible de mettre à jour le stock."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("flex h-9 items-center rounded-lg border bg-white", dirty ? "border-terra-400" : "border-sand-300")}>
        <button type="button" onClick={() => setDraft(String(Math.max(0, value - 1)))} className="grid h-full w-8 place-items-center text-ink-500 hover:text-ink-900" aria-label={`Retirer une unité de ${product.nom}`}>
          <Minus size={13} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setDraft(String(product.stock));
          }}
          inputMode="numeric"
          aria-label={`Stock de ${product.nom}`}
          className="h-full w-12 bg-transparent text-center text-sm font-semibold tabular-nums focus:outline-none"
        />
        <button type="button" onClick={() => setDraft(String(value + 1))} className="grid h-full w-8 place-items-center text-ink-500 hover:text-ink-900" aria-label={`Ajouter une unité à ${product.nom}`}>
          <Plus size={13} />
        </button>
      </div>
      {dirty ? (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="grid h-9 w-9 place-items-center rounded-lg bg-terra-600 text-white hover:bg-terra-700 disabled:opacity-50"
          aria-label="Enregistrer le stock"
          title="Enregistrer"
        >
          <Check size={16} />
        </button>
      ) : product.stock === 0 ? (
        <Badge tone="red">Épuisé</Badge>
      ) : product.stock < 5 ? (
        <Badge tone="saffron">Faible</Badge>
      ) : null}
    </div>
  );
}

export default function MesProduitsPage() {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [hasShop, setHasShop] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [error, setError] = useState("");
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    dispatch(fetchMyShop()).then((result) => {
      if (fetchMyShop.fulfilled.match(result)) setProducts(result.payload.products || []);
      else setHasShop(false);
      setLoading(false);
    });
  }, [dispatch]);

  const remove = async (product: Product) => {
    const ok = await confirm({
      title: `Supprimer « ${product.nom} » ?`,
      description: "Le produit disparaît définitivement de votre boutique. Les commandes passées restent consultables. Pour l’écarter temporairement, utilisez plutôt « Retirer de la vente ».",
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
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

  // Retirer de la vente (rupture, saison…) sans supprimer : le produit disparaît du catalogue.
  const toggleSale = async (product: Product) => {
    const next = !isOnSale(product);
    setTogglingId(product.id);
    setError("");
    try {
      await api.put(`/products/${product.id}/vente`, { en_vente: next });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, en_vente: next } : p)));
    } catch (err) {
      setError(apiError(err, "Impossible de modifier la mise en vente."));
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = products
    .filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()))
    .filter((p) =>
      stockFilter === "off" ? !isOnSale(p) : stockFilter === "out" ? p.stock === 0 : stockFilter === "low" ? p.stock > 0 && p.stock < 5 : true,
    );

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
      {confirmDialog}
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
                { value: "off", label: "Retirés", count: products.filter((p) => !isOnSale(p)).length },
              ]}
              value={stockFilter}
              onChange={setStockFilter}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-500">Aucun produit ne correspond.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-sand-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    <th className="px-5 py-3 font-semibold">Produit</th>
                    <th className="px-5 py-3 font-semibold">Catégorie</th>
                    <th className="px-5 py-3 text-right font-semibold">Prix</th>
                    <th className="px-5 py-3 font-semibold">Stock</th>
                    <th className="px-5 py-3 font-semibold">Vente</th>
                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className={`transition hover:bg-sand-50 ${isOnSale(p) ? "" : "bg-sand-50/70"}`}>
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
                        <StockEditor
                          key={`${p.id}-${p.stock}`}
                          product={p}
                          onSaved={(stock) => setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock } : x)))}
                          onError={setError}
                        />
                      </td>
                      <td className="px-5 py-3">
                        {isOnSale(p) ? <Badge tone="olive">En vente</Badge> : <Badge tone="ink">Retiré</Badge>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleSale(p)}
                            disabled={togglingId === p.id}
                            title={isOnSale(p) ? "Retirer de la vente" : "Remettre en vente"}
                            aria-label={isOnSale(p) ? `Retirer ${p.nom} de la vente` : `Remettre ${p.nom} en vente`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900 disabled:opacity-40"
                          >
                            {isOnSale(p) ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
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
