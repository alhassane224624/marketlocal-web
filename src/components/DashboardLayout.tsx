"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  ReceiptText,
  ShoppingBag,
  Store,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMe, logout } from "@/features/auth/authSlice";
import api from "@/lib/axios";
import { Logo } from "./MarketLocalUI";
import { Avatar, cn } from "./ui";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navByRole: Record<string, { title: string; items: NavItem[] }[]> = {
  acheteur: [
    {
      title: "Mon espace",
      items: [
        { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
        { label: "Mes commandes", href: "/mes-commandes", icon: ReceiptText },
        { label: "Mon panier", href: "/panier", icon: ShoppingBag },
        { label: "Profil & adresses", href: "/profil", icon: UserRound },
      ],
    },
  ],
  vendeur: [
    {
      title: "Boutique",
      items: [
        { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
        { label: "Ma boutique", href: "/ma-boutique", icon: Store },
        { label: "Produits", href: "/mes-produits", icon: Package },
        { label: "Commandes", href: "/mes-commandes-vendeur", icon: ReceiptText },
      ],
    },
    {
      title: "Suivi",
      items: [
        { label: "Statistiques", href: "/mes-statistiques", icon: BarChart3 },
        { label: "Avis clients", href: "/mes-avis-recus", icon: MessageSquareQuote },
        { label: "Mon profil", href: "/profil", icon: UserRound },
      ],
    },
  ],
  admin: [
    {
      title: "Plateforme",
      items: [
        { label: "Vue d’ensemble", href: "/dashboard", icon: LayoutDashboard },
        { label: "Statistiques", href: "/admin/statistiques", icon: BarChart3 },
        { label: "Commandes", href: "/admin/commandes", icon: ReceiptText },
      ],
    },
    {
      title: "Gestion",
      items: [
        { label: "Boutiques", href: "/admin/commissions", icon: Store },
        { label: "Utilisateurs", href: "/admin/utilisateurs", icon: Users },
        { label: "Catégories", href: "/admin/categories", icon: FolderTree },
      ],
    },
  ],
};

const roleLabel: Record<string, string> = {
  acheteur: "Acheteur",
  vendeur: "Vendeur",
  admin: "Administrateur",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  // Le tiroir mobile se referme tout seul en changeant de page.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  useEffect(() => {
    if (user) return;
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      dispatch(fetchMe());
    } else {
      // Pas (ou plus) de session : retour à la connexion, puis ici après login.
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, token, pathname, dispatch, router]);

  useEffect(() => {
    if (!user) return;
    const sellerPaths = ["/ma-boutique", "/mes-produits", "/mes-commandes-vendeur", "/mes-avis-recus", "/mes-statistiques", "/shop/create"];
    const needsSeller = sellerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    const needsAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
    const needsBuyer = ["/panier", "/paiement", "/mes-commandes"].some((path) => pathname === path || pathname.startsWith(`${path}/`));

    if (needsAdmin && user.role !== "admin") router.replace("/dashboard");
    else if (needsSeller && user.role !== "vendeur") router.replace("/dashboard");
    else if (needsBuyer && user.role !== "acheteur") router.replace("/dashboard");
  }, [pathname, user, router]);

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-sand-50">
        <div className="flex flex-col items-center gap-4">
          <Logo compact />
          <p className="text-sm text-ink-500">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  const sections = navByRole[user.role] || [];

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Le token est peut-être déjà expiré : on déconnecte quand même localement.
    }
    dispatch(logout());
    router.push("/login");
  };

  const sidebar = (
    <div className="zellige-light flex h-full flex-col bg-ink-900 text-sand-200">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo inverted />
        <button
          type="button"
          onClick={() => setOpenedOn(null)}
          className="grid h-9 w-9 place-items-center rounded-lg text-sand-300 hover:bg-white/10 lg:hidden"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6" aria-label="Navigation de l’espace">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-300">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        active ? "bg-white/10 text-white" : "text-sand-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-terra-400" />}
                      <Icon size={18} className={active ? "text-terra-300" : ""} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sand-300 hover:bg-white/5 hover:text-white">
          <ExternalLink size={18} /> Voir la marketplace
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-ink-300">{roleLabel[user.role]}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-8 w-8 place-items-center rounded-lg text-sand-300 hover:bg-white/10 hover:text-white"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Barre latérale fixe (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {/* Tiroir (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={() => setOpenedOn(null)} className="absolute inset-0 bg-ink-950/50" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-sand-200 bg-sand-50/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setOpenedOn(pathname)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-sand-300 bg-white text-ink-700"
            aria-label="Ouvrir le menu"
          >
            <Menu size={19} />
          </button>
          <Logo />
          <Avatar name={user.name} size="sm" className="ml-auto" />
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
