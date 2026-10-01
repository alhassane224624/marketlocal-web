"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Leaf,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import type { Product } from "@/features/products/productSlice";

export const money = (value: number | string | null | undefined) =>
  `${Number(value ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} MAD`;

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-600 text-white shadow-sm group-hover:bg-green-700 transition">
        <Leaf size={19} strokeWidth={2.5} />
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-tight text-slate-900">
          Market<span className="text-green-600">Local</span>
        </span>
        {!compact && <span className="mt-0.5 block text-[10px] text-slate-400">Le local à portée de clic</span>}
      </span>
    </Link>
  );
}

export function ProductVisual({ product, large = false }: { product: Pick<Product, "image" | "nom" | "category">; large?: boolean }) {
  if (product.image) {
    return <img src={product.image} alt={product.nom} className="h-full w-full object-cover" />;
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50 ${large ? "p-10" : "p-5"}`}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-green-100/70" />
      <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-amber-100/60" />
      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <div className={`${large ? "h-24 w-24" : "h-16 w-16"} grid place-items-center rounded-[28%] bg-white shadow-sm border border-white text-green-700`}>
          <Store size={large ? 42 : 28} />
        </div>
        <span className="mt-3 max-w-[90%] text-xs font-semibold text-slate-500 line-clamp-2">{product.category?.nom || "Produit local"}</span>
      </div>
    </div>
  );
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <Link href={`/catalogue/${product.id}`} className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.09)]">
      <div className={`${compact ? "h-36" : "h-48"} relative overflow-hidden bg-slate-50`}>
        <ProductVisual product={product} />
        <button type="button" aria-label="Ajouter aux favoris" onClick={(e) => e.preventDefault()} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur hover:text-red-500">
          <Heart size={15} />
        </button>
        {product.stock <= 0 && <span className="absolute left-3 top-3 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">Rupture</span>}
        {product.stock > 0 && product.stock < 5 && <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold text-white">Plus que {product.stock}</span>}
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-green-600">{product.category?.nom || "Local"}</span>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500"><Star size={12} fill="currentColor" /> 4,8</span>
        </div>
        <h3 className="line-clamp-1 text-sm font-bold text-slate-800 group-hover:text-green-700">{product.nom}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">{product.shop?.nom || "Vendeur local"}</p>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-base font-extrabold text-slate-900">{money(product.prix)}</p>
          <span className="text-[11px] text-slate-400">{product.stock} dispo.</span>
        </div>
      </div>
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    en_attente: "bg-amber-50 text-amber-700 ring-amber-100",
    payee: "bg-sky-50 text-sky-700 ring-sky-100",
    expediee: "bg-violet-50 text-violet-700 ring-violet-100",
    livree: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    annulee: "bg-red-50 text-red-700 ring-red-100",
    valide: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    refuse: "bg-red-50 text-red-700 ring-red-100",
  };
  const labels: Record<string, string> = {
    en_attente: "En attente",
    payee: "Payée",
    expediee: "Expédiée",
    livree: "Livrée",
    annulee: "Annulée",
    valide: "Active",
    refuse: "Refusée",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${map[status] || "bg-slate-50 text-slate-600 ring-slate-100"}`}>{labels[status] || status}</span>;
}

export function PublicHeader({ active = "" }: { active?: string }) {
  const { user } = useAppSelector((state) => state.auth);
  const cartCount = useAppSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantite, 0));
  const links = [
    ["Accueil", "/"],
    ["Catégories", "/catalogue"],
    ["Vendeurs", "/catalogue"],
    ["Promotions", "/catalogue"],
    ["À propos", "/"],
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1320px] items-center gap-5 px-4 py-3 lg:px-6">
        <Logo />
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-5 xl:flex">
          {links.map(([label, href]) => <Link key={label} href={href} className={`text-xs font-semibold transition ${active === label ? "text-green-600" : "text-slate-500 hover:text-green-600"}`}>{label}</Link>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/catalogue" className="hidden h-10 w-64 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 lg:flex">Rechercher un produit, une boutique...</Link>
          {user?.role === "acheteur" && <Link href="/panier" className="relative grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-50"><ShoppingCart size={18} />{cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-green-600 px-1 text-[9px] font-bold text-white">{cartCount}</span>}</Link>}
          {user ? <Link href="/dashboard" className="flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white"><span className="grid h-6 w-6 place-items-center rounded-lg bg-green-500">{user.name.charAt(0).toUpperCase()}</span><span className="hidden sm:block">Mon espace</span></Link> : <Link href="/login" className="rounded-xl bg-green-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-green-700">Se connecter</Link>}
        </div>
      </div>
    </header>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-green-600">{eyebrow && <span>{eyebrow}</span>}</div><h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>;
}

export function FeatureStrip() {
  const items = [
    { icon: MapPin, title: "Produits locaux", text: "Sélectionnés près de chez vous" },
    { icon: ShieldCheck, title: "Paiement sécurisé", text: "Transactions protégées" },
    { icon: Truck, title: "Livraison suivie", text: "Du vendeur à votre porte" },
    { icon: CheckCircle2, title: "Vendeurs vérifiés", text: "Une communauté de confiance" },
  ];
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-green-50 text-green-600"><Icon size={17} /></div><p className="text-sm font-bold text-slate-800">{title}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{text}</p></div>)}</div>;
}

export function EmptyState({ title, description, href, action }: { title: string; description?: string; href?: string; action?: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><ImageIcon size={21} /></div><h3 className="font-bold text-slate-800">{title}</h3>{description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{description}</p>}{href && <Link href={href} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-700">{action || "Commencer"}<ArrowRight size={14} /></Link>}</div>;
}
