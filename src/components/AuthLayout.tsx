"use client";

import type { ReactNode } from "react";
import { HandHeart, ShieldCheck, Truck } from "lucide-react";
import { Logo, StarMark } from "./MarketLocalUI";

/** Écran partagé connexion / inscription : panneau de marque + formulaire. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="zellige-light relative hidden overflow-hidden bg-ink-900 p-12 text-sand-100 lg:flex lg:flex-col lg:justify-between">
        <StarMark hole={false} className="absolute -bottom-24 -right-24 h-96 w-96 text-terra-600/25" />
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-terra-600/20 blur-3xl" aria-hidden />

        <Logo inverted />

        <div className="relative max-w-md">
          <p className="font-display text-[2.6rem] font-medium leading-[1.1] text-sand-50">
            « Chaque pièce raconte <em className="text-terra-300">un atelier</em>, une famille, un geste transmis. »
          </p>
          <ul className="mt-10 space-y-4 text-sm text-sand-300">
            <li className="flex items-center gap-3"><HandHeart size={18} className="text-terra-300" /> Achat direct aux artisans et coopératives</li>
            <li className="flex items-center gap-3"><ShieldCheck size={18} className="text-terra-300" /> Paiement sécurisé par Stripe</li>
            <li className="flex items-center gap-3"><Truck size={18} className="text-terra-300" /> Suivi de commande de bout en bout</li>
          </ul>
        </div>

        <p className="relative text-xs text-ink-300">MarketLocal · marketplace multi-vendeurs</p>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-8 sm:px-10 lg:min-h-0 lg:justify-center lg:px-16 xl:px-24">
        <div className="mb-10 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-md animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
