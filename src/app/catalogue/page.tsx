"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProducts } from "@/features/products/productSlice";
import { fetchCategories } from "@/features/categories/categorySlice";
import api from "@/lib/axios";
import { categoryStyle, ProductCard, SiteShell } from "@/components/MarketLocalUI";
import { Button, cn, EmptyState, inputClass, Select, Skeleton } from "@/components/ui";

interface Shop {
  id: number;
  nom: string;
}

export default function CataloguePage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <CatalogueFromUrl />
      </Suspense>
    </SiteShell>
  );
}

// Une recherche lancée depuis l'en-tête change l'URL : on repart de filtres neufs.
function CatalogueFromUrl() {
  const params = useSearchParams();
  return <Catalogue key={params.toString()} params={params} />;
}

function Catalogue({ params }: { params: URLSearchParams }) {
  const dispatch = useAppDispatch();
  const { items: products, status, currentPage, lastPage, total } = useAppSelector((s) => s.products);
  const { items: categories } = useAppSelector((s) => s.categories);
  const [shops, setShops] = useState<Shop[]>([]);
  const [category, setCategory] = useState<number | null>(params.get("category") ? Number(params.get("category")) : null);
  const [shop, setShop] = useState<number | null>(params.get("shop") ? Number(params.get("shop")) : null);
  const [search, setSearch] = useState(params.get("q") || "");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    api
      .get("/shops")
      .then((r) => setShops(r.data))
      .catch(() => setShops([]));
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        dispatch(
          fetchProducts({
            category_id: category || undefined,
            shop_id: shop || undefined,
            q: search || undefined,
            prix_min: min ? Number(min) : undefined,
            prix_max: max ? Number(max) : undefined,
            page,
          }),
        ),
      250,
    );
    return () => clearTimeout(timer);
  }, [dispatch, category, shop, search, min, max, page]);

  const reset = () => {
    setCategory(null);
    setShop(null);
    setSearch("");
    setMin("");
    setMax("");
    setPage(1);
  };

  const activeCategory = categories.find((c) => c.id === category);
  const activeShop = shops.find((s) => s.id === shop);
  const chips = [
    activeCategory && { label: activeCategory.nom, clear: () => setCategory(null) },
    activeShop && { label: activeShop.nom, clear: () => setShop(null) },
    search && { label: `« ${search} »`, clear: () => setSearch("") },
    (min || max) && { label: `${min || 0} – ${max || "∞"} MAD`, clear: () => { setMin(""); setMax(""); } },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const filters = (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Univers</p>
        <ul className="space-y-1">
          <li>
            <FilterButton active={category === null} onClick={() => { setCategory(null); setPage(1); }}>
              Tous les produits
            </FilterButton>
          </li>
          {categories.map((c) => {
            const Icon = categoryStyle(c.nom).icon;
            return (
              <li key={c.id}>
                <FilterButton active={category === c.id} onClick={() => { setCategory(category === c.id ? null : c.id); setPage(1); }}>
                  <Icon size={16} className="shrink-0 opacity-70" />
                  {c.nom}
                </FilterButton>
              </li>
            );
          })}
        </ul>
      </div>

      <label className="block">
        <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Vendeur</span>
        <Select value={shop ?? ""} onChange={(e) => { setShop(e.target.value ? Number(e.target.value) : null); setPage(1); }}>
          <option value="">Toutes les boutiques</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </Select>
      </label>

      <fieldset>
        <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Prix (MAD)</legend>
        <div className="flex items-center gap-2">
          <input aria-label="Prix minimum" value={min} onChange={(e) => { setMin(e.target.value); setPage(1); }} type="number" min="0" placeholder="Min" className={cn(inputClass, "h-10")} />
          <span className="text-ink-400">–</span>
          <input aria-label="Prix maximum" value={max} onChange={(e) => { setMax(e.target.value); setPage(1); }} type="number" min="0" placeholder="Max" className={cn(inputClass, "h-10")} />
        </div>
      </fieldset>

      {chips.length > 0 && (
        <Button variant="ghost" size="sm" onClick={reset} className="-ml-3">
          <X size={14} /> Effacer les filtres
        </Button>
      )}
    </div>
  );

  return (
    <>
      <section className="zellige border-b border-sand-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-terra-600">Catalogue</p>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
                {activeCategory ? activeCategory.nom : "Tous les produits"}
              </h1>
              <p className="mt-2 text-[15px] text-ink-500">
                {status === "loading" && !total ? "Chargement…" : `${total} produit${total > 1 ? "s" : ""} proposés par des vendeurs locaux`}
              </p>
            </div>
            <label className="relative block w-full lg:max-w-sm">
              <span className="sr-only">Rechercher dans le catalogue</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher un produit…"
                className="h-12 w-full rounded-full border border-sand-300 bg-white pl-11 pr-4 text-[15px] shadow-soft placeholder:text-ink-400 focus:border-terra-400 focus:outline-none focus:ring-4 focus:ring-terra-100"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filters}</div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMobileFilters(true)} className="lg:hidden">
              <SlidersHorizontal size={14} /> Filtres {chips.length > 0 && `(${chips.length})`}
            </Button>
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-900 px-3 text-xs font-semibold text-sand-50 hover:bg-ink-800"
              >
                {chip.label} <X size={13} aria-label="Retirer" />
              </button>
            ))}
          </div>

          {status === "loading" && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Aucun produit trouvé"
              description="Essayez un autre mot-clé ou élargissez la fourchette de prix."
              action={<Button variant="outline" onClick={reset}>Réinitialiser les filtres</Button>}
            />
          ) : (
            <div className={cn("grid grid-cols-2 gap-3 transition-opacity sm:gap-5 xl:grid-cols-3", status === "loading" && "opacity-60")}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
              <PageButton disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} label="Page précédente">
                <ChevronLeft size={16} />
              </PageButton>
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((n) => (
                <PageButton key={n} active={n === currentPage} onClick={() => setPage(n)} label={`Page ${n}`}>
                  {n}
                </PageButton>
              ))}
              <PageButton disabled={currentPage >= lastPage} onClick={() => setPage(currentPage + 1)} label="Page suivante">
                <ChevronRight size={16} />
              </PageButton>
            </nav>
          )}
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fermer" onClick={() => setMobileFilters(false)} className="absolute inset-0 bg-ink-950/50" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-sand-50 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-2xl font-semibold">Filtres</p>
              <button type="button" onClick={() => setMobileFilters(false)} className="grid h-9 w-9 place-items-center rounded-full bg-sand-100" aria-label="Fermer les filtres">
                <X size={18} />
              </button>
            </div>
            {filters}
            <Button className="mt-8 w-full" size="lg" onClick={() => setMobileFilters(false)}>
              Voir {total} produit{total > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
        active ? "bg-ink-900 text-sand-50" : "text-ink-700 hover:bg-sand-100",
      )}
    >
      {children}
    </button>
  );
}

function PageButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition disabled:opacity-40",
        active ? "bg-ink-900 text-sand-50" : "text-ink-700 hover:bg-sand-100",
      )}
    >
      {children}
    </button>
  );
}
