"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMe } from "@/features/auth/authSlice";
import api from "@/lib/axios";
import { logout } from "@/features/auth/authSlice";
import {
  BarChart3, Bell, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu, Package,
  Percent, Search, Settings, ShoppingBag, ShoppingCart, Store, Tag, User, Users, X,
} from "lucide-react";
import { Logo } from "./MarketLocalUI";

interface NavItem { label: string; href: string; icon: React.ReactNode; }

const navByRole: Record<string, NavItem[]> = {
  acheteur: [
    { label: "Tableau de bord", href: "/dashboard", icon: <LayoutDashboard size={17} /> },
    { label: "Catalogue", href: "/catalogue", icon: <Store size={17} /> },
    { label: "Mes commandes", href: "/mes-commandes", icon: <Package size={17} /> },
    { label: "Mon profil", href: "/profil", icon: <User size={17} /> },
  ],
  vendeur: [
    { label: "Tableau de bord", href: "/dashboard", icon: <LayoutDashboard size={17} /> },
    { label: "Ma boutique", href: "/ma-boutique", icon: <Store size={17} /> },
    { label: "Produits", href: "/mes-produits", icon: <Package size={17} /> },
    { label: "Commandes", href: "/mes-commandes-vendeur", icon: <ShoppingCart size={17} /> },
    { label: "Avis clients", href: "/mes-avis-recus", icon: <ShoppingBag size={17} /> },
    { label: "Statistiques", href: "/mes-statistiques", icon: <BarChart3 size={17} /> },
    { label: "Mon profil", href: "/profil", icon: <User size={17} /> },
  ],
  admin: [
    { label: "Tableau de bord", href: "/dashboard", icon: <LayoutDashboard size={17} /> },
    { label: "Utilisateurs", href: "/admin/utilisateurs", icon: <Users size={17} /> },
    { label: "Boutiques", href: "/admin/commissions", icon: <Store size={17} /> },
    { label: "Commandes", href: "/admin/commandes", icon: <ShoppingCart size={17} /> },
    { label: "Catégories", href: "/admin/categories", icon: <Tag size={17} /> },
    { label: "Statistiques", href: "/admin/statistiques", icon: <BarChart3 size={17} /> },
  ],
};

const roleLabel: Record<string, string> = { acheteur: "Acheteur", vendeur: "Vendeur", admin: "Administrateur" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const cartCount = useAppSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantite, 0));
  const [open, setOpen] = useState(false);

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

  if (!user) return <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center"><p className="text-sm text-slate-400">Chargement de votre espace...</p></div>;

  const nav = navByRole[user.role] || [];
  const handleLogout = async () => {
    try { await api.post("/logout"); } catch {}
    dispatch(logout());
    setOpen(false);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] text-slate-800">
      {open && <button aria-label="Fermer" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-slate-100 bg-white transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-[76px] items-center border-b border-slate-100 px-5"><Logo compact /><button onClick={() => setOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 lg:hidden"><X size={18} /></button></div>
        <div className="mx-4 mt-4 rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-green-100 font-extrabold text-green-700">{user.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{user.name}</p><p className="text-[10px] font-medium text-slate-400">{roleLabel[user.role]}</p></div></div></div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">{nav.map((item) => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`group mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${active ? "bg-green-50 text-green-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>{item.icon}<span className="flex-1">{item.label}</span>{active && <ChevronRight size={14} />}</Link>; })}</nav>
        <div className="border-t border-slate-100 p-3"><Link href="/profil" className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-50"><Settings size={17} /> Paramètres</Link><button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-50"><LogOut size={17} /> Déconnexion</button></div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"><Menu size={19} /></button>
          <div className="hidden max-w-xl flex-1 sm:block"><div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400"><Search size={16} /><input className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400" placeholder="Rechercher dans MarketLocal..." /></div></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3"><Link href={user.role === "acheteur" ? "/panier" : "/dashboard"} className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50">{user.role === "acheteur" ? <ShoppingCart size={17} /> : <Bell size={17} />}{user.role === "acheteur" && cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-green-600 px-1 text-[9px] font-bold text-white">{cartCount}</span>}</Link><div className="hidden h-7 w-px bg-slate-200 sm:block" /><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-green-100 text-xs font-extrabold text-green-700">{user.name.charAt(0).toUpperCase()}</div><div className="hidden md:block"><p className="text-xs font-bold text-slate-800">{user.name}</p><p className="text-[10px] text-slate-400">{roleLabel[user.role]}</p></div></div></div>
        </header>
        <main className="min-h-[calc(100vh-76px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-[1240px]">{children}</div></main>
      </div>
    </div>
  );
}
