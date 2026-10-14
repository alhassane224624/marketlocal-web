"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  Check,
  Flower2,
  HandHeart,
  Lamp,
  Menu,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Store,
  Truck,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import type { Product } from "@/features/products/productSlice";
import { cn, money, Stars } from "@/components/ui";

// Compatibilité : plusieurs pages importent encore ces helpers depuis ce module.
export { money, StatusBadge, EmptyState } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Marque                                                              */
/* ------------------------------------------------------------------ */

export function StarMark({ className, hole = true }: { className?: string; hole?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 1.5l4.2 10.3L30.5 16l-10.3 4.2L16 30.5l-4.2-10.3L1.5 16l10.3-4.2z" fill="currentColor" />
      <rect x="9.5" y="9.5" width="13" height="13" transform="rotate(45 16 16)" fill="currentColor" />
      {hole && <circle cx="16" cy="16" r="3.2" fill="#fbf8f3" />}
    </svg>
  );
}

export function Logo({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="MarketLocal, accueil">
      <StarMark className="h-8 w-8 text-terra-500 transition-transform duration-500 group-hover:rotate-45" />
      {!compact && (
        <span className={cn("font-display text-[1.35rem] font-semibold leading-none", inverted ? "text-sand-50" : "text-ink-900")}>
          Market<span className="italic text-terra-500">Local</span>
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels produits (illustration par catégorie)                       */
/* ------------------------------------------------------------------ */

const categoryStyles: { match: RegExp; icon: LucideIcon; bg: string; arch: string; fg: string }[] = [
  { match: /artisan/i, icon: HandHeart, bg: "bg-terra-100", arch: "bg-terra-50", fg: "text-terra-600" },
  { match: /aliment|épice|miel/i, icon: Wheat, bg: "bg-saffron-100", arch: "bg-saffron-50", fg: "text-saffron-700" },
  { match: /cosm|beaut|soin/i, icon: Flower2, bg: "bg-olive-100", arch: "bg-olive-50", fg: "text-olive-600" },
  { match: /vêtement|textile|mode/i, icon: Shirt, bg: "bg-sky-100", arch: "bg-sky-50", fg: "text-sky-800" },
  { match: /déco|maison/i, icon: Lamp, bg: "bg-sand-200", arch: "bg-sand-50", fg: "text-ink-700" },
];

export function categoryStyle(name?: string | null) {
  return (
    categoryStyles.find((style) => name && style.match.test(name)) || {
      icon: Store,
      bg: "bg-sand-200",
      arch: "bg-sand-50",
      fg: "text-ink-700",
    }
  );
}

export function ProductVisual({
  product,
  large = false,
}: {
  product: { image?: string | null; nom: string; category?: { nom: string } | null };
  large?: boolean;
}) {
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image} alt={product.nom} className="h-full w-full object-cover" />;
  }

  const style = categoryStyle(product.category?.nom);
  const Icon = style.icon;
  return (
    <div className={cn("zellige relative flex h-full w-full items-end justify-center overflow-hidden", style.bg)} role="img" aria-label={product.nom}>
      {/* Arche mauresque */}
      <div className={cn("relative flex h-[78%] w-[52%] items-center justify-center rounded-t-full border-4 border-white/70 shadow-[inset_0_-12px_30px_rgb(255_255_255/0.6)]", style.arch)}>
        <Icon size={large ? 72 : 36} strokeWidth={1.4} className={style.fg} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carte produit                                                       */
/* ------------------------------------------------------------------ */

export function ProductCard({ product }: { product: Product }) {
  const rating = product.note_moyenne;
  return (
    <Link
      href={`/catalogue/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition duration-500 group-hover:scale-[1.04]">
          <ProductVisual product={product} />
        </div>
        {product.stock <= 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink-900/90 px-2.5 py-1 text-[11px] font-semibold text-sand-50">
            Épuisé
          </span>
        ) : (
          product.stock < 5 && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-terra-700 shadow-sm">
              Plus que {product.stock}
            </span>
          )
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500 sm:text-[11px]">
          {product.category?.nom || "Produit local"}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-display text-[0.95rem] font-semibold leading-snug sm:text-[1.05rem] text-ink-900 group-hover:text-terra-700">
          {product.nom}
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] text-ink-500">{product.shop?.nom || "Vendeur local"}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-3 sm:pt-4">
          <p className="text-base font-bold text-ink-900 tabular-nums sm:text-lg">{money(product.prix)}</p>
          {rating ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-ink-600">
              <Stars value={rating} size={12} />
              {String(rating).replace(".", ",")}
            </span>
          ) : (
            <span className="text-xs text-ink-500">Nouveau</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* En-tête et pied de page publics                                     */
/* ------------------------------------------------------------------ */

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Vendre sur MarketLocal", href: "/register?role=vendeur" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const cartCount = useAppSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantite, 0));
  const [query, setQuery] = useState("");
  // Le menu mobile se referme tout seul en changeant de page.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);

  const search = (e: FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/catalogue?q=${encodeURIComponent(query.trim())}` : "/catalogue");
  };

  const showCart = !user || user.role === "acheteur";

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-sand-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.split("?")[0]);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  active ? "text-terra-700" : "text-ink-600 hover:text-ink-900",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={search} className="ml-auto hidden max-w-xs flex-1 md:block" role="search">
          <label className="relative block">
            <span className="sr-only">Rechercher</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tapis, argan, lanterne…"
              className="h-10 w-full rounded-full border border-sand-300 bg-white pl-10 pr-4 text-sm placeholder:text-ink-400 focus:border-terra-400 focus:outline-none focus:ring-4 focus:ring-terra-100"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          {showCart && (
            <Link
              href="/panier"
              aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-sand-100"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-terra-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <Link
              href="/dashboard"
              className="hidden h-10 items-center gap-2 rounded-full border border-sand-300 bg-white pl-1 pr-4 text-sm font-semibold text-ink-800 transition hover:border-ink-300 sm:flex"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-terra-100 text-xs font-bold text-terra-800">
                {user.name.charAt(0).toUpperCase()}
              </span>
              Mon espace
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-full bg-ink-900 px-5 text-sm font-semibold text-sand-50 transition hover:bg-ink-800 sm:flex"
            >
              Se connecter
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-sand-100 lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-sand-200 bg-sand-50 px-4 pb-5 pt-3 lg:hidden">
          <form onSubmit={search} className="mb-3 md:hidden" role="search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              className="h-11 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm focus:border-terra-400 focus:outline-none focus:ring-4 focus:ring-terra-100"
            />
          </form>
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="rounded-lg px-2 py-3 text-[15px] font-semibold text-ink-800 hover:bg-sand-100">
                {link.label}
              </Link>
            ))}
            <Link
              href={user ? "/dashboard" : "/login"}
              className="mt-2 rounded-xl bg-ink-900 px-4 py-3 text-center text-[15px] font-semibold text-sand-50"
            >
              {user ? "Mon espace" : "Se connecter"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-24 bg-ink-900 text-sand-200">
      <div className="zellige-light">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-300">
              La marketplace des artisans, coopératives et producteurs locaux. Achetez en direct, au juste prix.
            </p>
          </div>
          <FooterColumn title="Acheter" links={[["Catalogue", "/catalogue"], ["Mon panier", "/panier"], ["Mes commandes", "/mes-commandes"]]} />
          <FooterColumn title="Vendre" links={[["Ouvrir ma boutique", "/register?role=vendeur"], ["Espace vendeur", "/dashboard"]]} />
          <FooterColumn title="Compte" links={[["Connexion", "/login"], ["Créer un compte", "/register"], ["Mon profil", "/profil"]]} />
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-ink-300 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {new Date().getFullYear()} MarketLocal — Projet portfolio d’Alhassane Diané.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck size={14} /> Paiements sécurisés par Stripe
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sand-400">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-sand-200 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Page publique : en-tête, contenu centré, pied de page. */
export function SiteShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      {footer && <PublicFooter />}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-terra-600">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">{title}</h2>
        {description && <p className="mt-2 max-w-xl text-[15px] text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export const reassurance = [
  { icon: HandHeart, title: "En direct des ateliers", text: "Chaque achat rémunère l’artisan qui a fabriqué l’objet." },
  { icon: ShieldCheck, title: "Paiement sécurisé", text: "Vos données bancaires sont traitées par Stripe, jamais stockées." },
  { icon: Truck, title: "Suivi de commande", text: "De la préparation à la livraison, étape par étape." },
];

/** Étapes du tunnel d'achat. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  const steps = ["Panier", "Paiement", "Confirmation"];
  return (
    <ol className="flex items-center gap-2 text-sm sm:gap-3" aria-label="Étapes de la commande">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span
            className={cn(
              "flex items-center gap-2 font-semibold",
              i === current ? "text-ink-900" : i < current ? "text-olive-600" : "text-ink-400",
            )}
            aria-current={i === current ? "step" : undefined}
          >
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-xs",
                i === current ? "bg-ink-900 text-sand-50" : i < current ? "bg-olive-100 text-olive-700" : "bg-sand-200 text-ink-500",
              )}
            >
              {i < current ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </span>
          {i < steps.length - 1 && <span className="h-px w-6 bg-sand-300 sm:w-12" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
