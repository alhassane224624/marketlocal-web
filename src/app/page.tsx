"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Heart, Leaf, MapPin, ShieldCheck, Sparkles, Star, Store, Users } from "lucide-react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProducts } from "@/features/products/productSlice";
import { fetchCategories } from "@/features/categories/categorySlice";
import { Logo, ProductCard, FeatureStrip, SectionHeading } from "@/components/MarketLocalUI";

const categoryVisuals = ["Artisanat", "Alimentation locale", "Mode & textile", "Maison & déco", "Beauté & soins", "Électronique"];

export default function Home() {
  const dispatch = useAppDispatch();
  const { items: products } = useAppSelector((s) => s.products);
  const { items: categories } = useAppSelector((s) => s.categories);

  useEffect(() => { dispatch(fetchProducts({})); dispatch(fetchCategories()); }, [dispatch]);

  const displayedCategories = categories.length ? categories.map((c) => c.nom) : categoryVisuals;

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1320px] items-center gap-5 px-4 py-3 lg:px-6"><Logo /><nav className="hidden flex-1 items-center justify-center gap-6 xl:flex"><Link className="text-xs font-bold text-green-600" href="/">Accueil</Link><Link className="text-xs font-semibold text-slate-500 hover:text-green-600" href="/catalogue">Catégories</Link><Link className="text-xs font-semibold text-slate-500 hover:text-green-600" href="/catalogue">Vendeurs</Link><Link className="text-xs font-semibold text-slate-500 hover:text-green-600" href="/catalogue">Promotions</Link><Link className="text-xs font-semibold text-slate-500 hover:text-green-600" href="#apropos">À propos</Link></nav><div className="ml-auto flex items-center gap-2"><Link href="/catalogue" className="hidden h-10 w-56 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 md:flex">Rechercher un produit...</Link><Link href="/login" className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-green-700">Se connecter</Link></div></div></header>

      <main>
        <section className="market-grid mx-auto max-w-[1320px] px-4 pt-5 lg:px-6">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#063b27] via-[#087a42] to-[#16a34a] px-6 py-12 text-white shadow-[0_24px_70px_rgba(22,163,74,.22)] sm:px-10 lg:min-h-[400px] lg:px-14 lg:py-14">
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10" /><div className="absolute -bottom-28 right-20 h-80 w-80 rounded-full bg-lime-300/10" />
            <div className="relative max-w-2xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold ring-1 ring-white/15"><Sparkles size={13} /> Le meilleur du local, en un clic</span><h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[58px]">Découvrez le savoir-faire <span className="text-lime-200">local.</span></h1><p className="mt-5 max-w-lg text-sm leading-6 text-white/80 sm:text-base">Des produits authentiques, des créateurs passionnés et une expérience d'achat simple, humaine et sécurisée.</p><div className="mt-7 flex flex-col gap-2 sm:flex-row"><Link href="/catalogue" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-green-800 shadow-lg hover:bg-lime-50">Explorer le catalogue <ArrowRight size={15} /></Link><Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-bold text-white hover:bg-white/15">Devenir vendeur</Link></div><div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-white/75"><span className="inline-flex items-center gap-1.5"><MapPin size={13} /> Vendeurs locaux</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Paiement sécurisé</span><span className="inline-flex items-center gap-1.5"><Users size={13} /> Communauté vérifiée</span></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 py-7 lg:px-6"><FeatureStrip /></section>

        <section className="mx-auto max-w-[1320px] px-4 pb-10 lg:px-6"><SectionHeading eyebrow="Explorer" title="Nos catégories" action={<Link href="/catalogue" className="inline-flex items-center gap-1 text-xs font-bold text-green-600">Voir tout <ChevronRight size={14} /></Link>} /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{displayedCategories.slice(0, 6).map((name, index) => <Link key={name} href={`/catalogue?category=${index + 1}`} className="group rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-green-100 hover:shadow-md"><div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-green-50 to-amber-50 text-xl group-hover:scale-105 transition">{["🧺", "🥬", "👗", "🏺", "🌿", "💻"][index]}</div><p className="text-xs font-bold text-slate-700">{name}</p><p className="mt-1 text-[10px] text-slate-400">Découvrir</p></Link>)}</div></section>

        <section className="mx-auto max-w-[1320px] px-4 pb-12 lg:px-6"><SectionHeading eyebrow="Sélection locale" title="Produits populaires" action={<Link href="/catalogue" className="inline-flex items-center gap-1 text-xs font-bold text-green-600">Voir tout <ChevronRight size={14} /></Link>} />{products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} compact />)}</div> : <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">Les produits apparaîtront ici dès que le catalogue sera alimenté.</div>}</section>

        <section id="apropos" className="border-y border-slate-100 bg-white"><div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-12 lg:grid-cols-2 lg:px-6"><div><span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-green-600">Notre mission</span><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Plus qu'une marketplace, une communauté de talents locaux.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">MarketLocal rapproche les acheteurs des artisans, producteurs et petites boutiques. Chaque commande soutient directement l'économie locale.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-green-50 p-5"><Leaf className="text-green-600" /><p className="mt-6 text-2xl font-black text-slate-900">100%</p><p className="text-xs text-slate-500">orienté local</p></div><div className="rounded-2xl bg-slate-50 p-5"><Heart className="text-red-500" /><p className="mt-6 text-2xl font-black text-slate-900">Humain</p><p className="text-xs text-slate-500">avant tout</p></div><div className="rounded-2xl bg-amber-50 p-5"><Star className="text-amber-500" fill="currentColor" /><p className="mt-6 text-2xl font-black text-slate-900">Qualité</p><p className="text-xs text-slate-500">et authenticité</p></div><div className="rounded-2xl bg-blue-50 p-5"><Store className="text-blue-600" /><p className="mt-6 text-2xl font-black text-slate-900">Local</p><p className="text-xs text-slate-500">vendeurs vérifiés</p></div></div></div></section>
      </main>
      <footer className="bg-[#073c28] px-4 py-8 text-white"><div className="mx-auto flex max-w-[1320px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><Logo compact /><p className="text-xs text-white/60">Ensemble pour un commerce plus humain.</p></div></footer>
    </div>
  );
}
