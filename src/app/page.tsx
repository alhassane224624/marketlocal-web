"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, PackageCheck, Percent, Search, ShieldCheck, ShoppingBag, Sparkles, Store } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProducts } from "@/features/products/productSlice";
import { fetchCategories } from "@/features/categories/categorySlice";
import {
  categoryStyle,
  ProductCard,
  ProductVisual,
  reassurance,
  SectionHeading,
  SiteShell,
} from "@/components/MarketLocalUI";
import { ButtonLink, cn, money, Skeleton } from "@/components/ui";

const suggestions = ["Tapis berbère", "Huile d’argan", "Lanterne", "Miel"];

export default function Home() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items: products, status } = useAppSelector((s) => s.products);
  const { items: categories } = useAppSelector((s) => s.categories);
  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(fetchProducts({}));
    dispatch(fetchCategories());
  }, [dispatch]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/catalogue?q=${encodeURIComponent(query.trim())}` : "/catalogue");
  };

  const featured = products.slice(0, 3);
  const loading = status === "loading" && products.length === 0;

  return (
    <SiteShell>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="zellige absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-terra-200 bg-white/80 px-3 py-1 text-xs font-semibold text-terra-700">
              <Sparkles size={13} /> Artisans, coopératives & producteurs locaux
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.05] text-ink-900 sm:text-6xl">
              Le savoir-faire local,{" "}
              <em className="font-medium text-terra-600">en direct des ateliers.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-600">
              Tapis tissés à la main, huiles de coopératives, cuivre ciselé : achetez directement à celles et ceux qui
              fabriquent, et suivez votre commande jusqu’à votre porte.
            </p>

            <form onSubmit={search} className="mt-8 flex max-w-lg gap-2 rounded-2xl border border-sand-300 bg-white p-2 shadow-soft" role="search">
              <label className="flex flex-1 items-center gap-2 pl-2">
                <Search size={18} className="shrink-0 text-ink-400" />
                <span className="sr-only">Rechercher un produit</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Que cherchez-vous ?"
                  className="h-11 w-full bg-transparent text-[15px] placeholder:text-ink-400 focus:outline-none"
                />
              </label>
              <button className="h-11 rounded-xl bg-terra-600 px-5 text-sm font-semibold text-white transition hover:bg-terra-700">
                Rechercher
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-500">
              <span>Populaire :</span>
              {suggestions.map((s) => (
                <Link
                  key={s}
                  href={`/catalogue?q=${encodeURIComponent(s)}`}
                  className="rounded-full border border-sand-300 bg-white/70 px-3 py-1 text-[13px] font-medium text-ink-700 transition hover:border-terra-300 hover:text-terra-700"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          {/* Mosaïque d'arches */}
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 lg:max-w-none">
            {[0, 1, 2].map((i) => {
              const product = featured[i];
              return (
                <div
                  key={i}
                  className={cn(
                    "group relative overflow-hidden rounded-t-[999px] rounded-b-3xl border-[6px] border-white bg-white shadow-lift",
                    i === 0 ? "row-span-2 aspect-[3/5]" : "aspect-[4/5]",
                  )}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  {product ? (
                    <Link href={`/catalogue/${product.id}`} className="block h-full">
                      <ProductVisual product={product} large={i === 0} />
                      <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-soft backdrop-blur">
                        <p className="line-clamp-1 text-[13px] font-semibold text-ink-900">{product.nom}</p>
                        <p className="text-xs text-ink-500">{money(product.prix)}</p>
                      </div>
                    </Link>
                  ) : (
                    <Skeleton className="h-full rounded-none" />
                  )}
                </div>
              );
            })}
            <div className="absolute -left-4 top-10 hidden rounded-2xl border border-sand-200 bg-white px-4 py-3 shadow-lift sm:flex sm:items-center sm:gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-olive-50 text-olive-600">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink-900">Paiement sécurisé</p>
                <p className="text-xs text-ink-500">Traité par Stripe</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Réassurance */}
      <section className="border-y border-sand-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          {reassurance.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-terra-50 text-terra-600">
                <Icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-ink-900">{title}</p>
                <p className="mt-1 text-sm text-ink-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- Catégories */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHeading
          eyebrow="Explorer"
          title="Par univers"
          description="Cinq familles de produits, sélectionnées auprès d’ateliers et de coopératives."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(categories.length ? categories : Array.from({ length: 5 }, () => null)).map((category, i) =>
            category ? (
              <CategoryTile key={category.id} id={category.id} nom={category.nom} />
            ) : (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ),
          )}
        </div>
      </section>

      {/* ----------------------------------------------------- Nouveautés */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHeading
          eyebrow="Nouveautés"
          title="Fraîchement arrivés"
          description="Les dernières pièces mises en ligne par nos vendeurs."
          action={
            <ButtonLink href="/catalogue" variant="outline">
              Tout le catalogue <ArrowRight size={16} />
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)
            : products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* ------------------------------------------------ Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-terra-600">Comment ça marche</p>
            <h2 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
              Du métier à tisser à votre salon, en trois étapes.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
              Une seule commande peut réunir plusieurs boutiques : chaque vendeur prépare et expédie ses articles, vous
              suivez tout au même endroit.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Search, title: "Découvrez", text: "Filtrez par univers, prix ou vendeur et lisez les avis vérifiés." },
              { icon: ShoppingBag, title: "Commandez", text: "Panier multi-boutiques, paiement par carte sécurisé par Stripe." },
              { icon: PackageCheck, title: "Recevez", text: "Suivez la préparation, l’expédition puis la livraison." },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-2xl border border-sand-200 bg-white p-6 shadow-soft">
                <span className="font-display text-5xl font-semibold text-sand-200">0{i + 1}</span>
                <span className="absolute right-5 top-6 grid h-10 w-10 place-items-center rounded-full bg-sand-100 text-ink-700">
                  <Icon size={18} />
                </span>
                <p className="mt-4 font-semibold text-ink-900">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ Vendeurs */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="zellige-light relative overflow-hidden rounded-[2rem] bg-ink-900 px-6 py-14 sm:px-12 lg:py-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-terra-600/30 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-terra-300">Vous êtes artisan ou producteur ?</p>
              <h2 className="font-display text-3xl font-semibold leading-tight text-sand-50 sm:text-[2.6rem]">
                Ouvrez votre boutique, nous vous rendons visible.
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-sand-300">
                Créez votre vitrine en quelques minutes, publiez vos produits et recevez vos paiements directement via
                Stripe. Pas d’abonnement : une simple commission sur les ventes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/register?role=vendeur" size="lg">
                  Devenir vendeur <ArrowUpRight size={18} />
                </ButtonLink>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-xl border border-white/25 px-6 text-[15px] font-semibold text-sand-50 transition hover:border-white/50 hover:bg-white/5"
                >
                  J’ai déjà un compte
                </Link>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                { icon: Store, label: "Boutique vérifiée", value: "Par l’équipe" },
                { icon: Percent, label: "Commission par défaut", value: "10 %" },
                { icon: ShoppingBag, label: "Frais d’abonnement", value: "0 MAD" },
                { icon: PackageCheck, label: "Paiement vendeur", value: "Stripe" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <Icon size={18} className="text-terra-300" />
                  <dd className="mt-3 font-display text-2xl font-semibold text-sand-50">{value}</dd>
                  <dt className="mt-1 text-xs text-sand-300">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function CategoryTile({ id, nom }: { id: number; nom: string }) {
  const style = categoryStyle(nom);
  const Icon = style.icon;
  return (
    <Link
      href={`/catalogue?category=${id}`}
      className={cn(
        "zellige group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift",
        style.bg,
      )}
    >
      <span className={cn("grid h-14 w-12 place-items-center rounded-t-full border-2 border-white/80 bg-white/70", style.fg)}>
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <div>
        <p className="font-display text-lg font-semibold leading-snug text-ink-900">{nom}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-700">
          Découvrir <ArrowRight size={14} className="transition group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}
