"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Filter, Grid2X2, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProducts } from "@/features/products/productSlice";
import { fetchCategories } from "@/features/categories/categorySlice";
import api from "@/lib/axios";
import { ProductCard, PublicHeader } from "@/components/MarketLocalUI";

interface Shop { id: number; nom: string; }

export default function CataloguePage() {
  const dispatch = useAppDispatch();
  const { items: products, status, currentPage, lastPage } = useAppSelector((s) => s.products);
  const { items: categories } = useAppSelector((s) => s.categories);
  const [shops, setShops] = useState<Shop[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [shop, setShop] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => { dispatch(fetchCategories()); api.get("/shops").then((r) => setShops(r.data)).catch(() => setShops([])); }, [dispatch]);
  useEffect(() => { const timer = setTimeout(() => dispatch(fetchProducts({ category_id: category || undefined, shop_id: shop || undefined, q: search || undefined, prix_min: min ? Number(min) : undefined, prix_max: max ? Number(max) : undefined, page })), 250); return () => clearTimeout(timer); }, [dispatch, category, shop, search, min, max, page]);

  const reset = () => { setCategory(null); setShop(null); setSearch(""); setMin(""); setMax(""); setPage(1); };
  const filters = <div className="space-y-6"><div><div className="mb-3 flex items-center justify-between"><p className="text-xs font-extrabold text-slate-800">Catégories</p>{category && <button onClick={() => setCategory(null)} className="text-[10px] text-green-600">Réinitialiser</button>}</div><div className="space-y-1.5">{categories.map((c) => <button key={c.id} onClick={() => { setCategory(category === c.id ? null : c.id); setPage(1); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${category === c.id ? "bg-green-50 text-green-700" : "text-slate-500 hover:bg-slate-50"}`}><span>{c.nom}</span><span className="text-[10px] text-slate-400">›</span></button>)}</div></div><div className="h-px bg-slate-100" /><div><p className="mb-3 text-xs font-extrabold text-slate-800">Vendeurs</p><select value={shop ?? ""} onChange={(e) => { setShop(e.target.value ? Number(e.target.value) : null); setPage(1); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-green-300"><option value="">Tous les vendeurs</option>{shops.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div><div className="h-px bg-slate-100" /><div><p className="mb-3 text-xs font-extrabold text-slate-800">Prix</p><div className="grid grid-cols-2 gap-2"><input value={min} onChange={(e) => { setMin(e.target.value); setPage(1); }} type="number" min="0" placeholder="Min" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-green-300" /><input value={max} onChange={(e) => { setMax(e.target.value); setPage(1); }} type="number" min="0" placeholder="Max" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-green-300" /></div></div><button onClick={reset} className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Effacer les filtres</button></div>;

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <PublicHeader active="Catégories" />
      <main className="mx-auto max-w-[1320px] px-4 py-7 lg:px-6">
        <div className="mb-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-green-600">Marketplace</p>
          <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Tous les produits <span className="text-slate-400">({products.length}{lastPage > 1 ? "+" : ""})</span></h1>
              <p className="mt-1 text-sm text-slate-500">Des produits authentiques proposés par des vendeurs locaux.</p>
            </div>
            <button onClick={() => setMobileFilters(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 lg:hidden"><SlidersHorizontal size={15} /> Filtres</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:block">{filters}</aside>
          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                <Search size={17} className="text-slate-400" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher un produit..." className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400" />
                {search && <button onClick={() => setSearch("")}><X size={15} className="text-slate-400" /></button>}
              </div>
              <button className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 sm:flex"><Grid2X2 size={15} /> Grille <ChevronDown size={14} /></button>
            </div>

            {status === "loading" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center"><Filter className="mx-auto text-slate-300" /><h3 className="mt-3 font-bold text-slate-800">Aucun produit trouvé</h3><p className="mt-1 text-sm text-slate-400">Modifiez vos filtres ou essayez une autre recherche.</p><button onClick={reset} className="mt-4 text-xs font-bold text-green-600">Effacer les filtres</button></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} compact />)}</div>
                {lastPage > 1 && <div className="mt-7 flex items-center justify-center gap-2"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">Précédent</button><span className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white">{currentPage}</span><button disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">Suivant</button></div>}
              </>
            )}
          </div>
        </div>
      </main>

      {mobileFilters && <div className="fixed inset-0 z-[60] bg-slate-950/30 lg:hidden"><div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><p className="font-extrabold">Filtres</p><button onClick={() => setMobileFilters(false)} className="rounded-xl bg-slate-50 p-2"><X size={17} /></button></div>{filters}<button onClick={() => setMobileFilters(false)} className="mt-5 w-full rounded-xl bg-green-600 py-3 text-xs font-bold text-white">Voir les produits</button></div></div>}
    </div>
  );
}

function Skeleton() { return <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />; }
