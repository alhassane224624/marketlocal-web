"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Copy, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { login } from "@/features/auth/authSlice";
import AuthLayout from "@/components/AuthLayout";
import { Alert, Button, cn, Field, Input } from "@/components/ui";

// Comptes créés par les seeders de l'API (php artisan migrate --seed).
// Masquables en production avec NEXT_PUBLIC_DEMO_ACCOUNTS=false.
const DEMO_PASSWORD = "password";
const demoAccounts = [
  { role: "Acheteur", email: "acheteur@marketlocal.test", icon: ShoppingBag, text: "Panier, paiement, suivi, avis", tone: "bg-saffron-50 text-saffron-700" },
  { role: "Vendeuse", email: "vendeur@marketlocal.test", icon: Store, text: "Boutique, produits, commandes reçues", tone: "bg-terra-50 text-terra-700" },
  { role: "Administrateur", email: "admin@marketlocal.test", icon: ShieldCheck, text: "Validation, commissions, statistiques", tone: "bg-olive-50 text-olive-700" },
];
const showDemo = process.env.NEXT_PUBLIC_DEMO_ACCOUNTS !== "false";

// Destination après connexion (?redirect=/panier). Chemins internes uniquement.
function safeRedirect(): string {
  const target = new URLSearchParams(window.location.search).get("redirect");
  return target && target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await dispatch(login({ email, password }));
    if (login.fulfilled.match(r)) router.push(safeRedirect());
  };

  const fillAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Presse-papiers indisponible (HTTP, permissions) : rien à faire.
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl font-semibold text-ink-900">Bon retour parmi nous</h1>
      <p className="mt-2 text-[15px] text-ink-500">Connectez-vous pour retrouver votre espace.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field label="Adresse e-mail">
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ma" />
        </Field>
        <Field label="Mot de passe">
          <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        {status === "failed" && error && <Alert>{error}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={status === "loading"}>
          Se connecter {status !== "loading" && <ArrowRight size={18} />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-terra-700 hover:underline">
          Créer un compte
        </Link>
      </p>

      {showDemo && (
        <section className="mt-10 rounded-2xl border border-sand-200 bg-white p-5 shadow-soft" aria-labelledby="demo-title">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="demo-title" className="text-sm font-bold text-ink-900">Comptes de démonstration</h2>
            <p className="text-xs text-ink-500">
              Mot de passe :{" "}
              <button type="button" onClick={() => copy(DEMO_PASSWORD)} className="inline-flex items-center gap-1 rounded bg-sand-100 px-1.5 py-0.5 font-mono font-semibold text-ink-800 hover:bg-sand-200" title="Copier">
                {DEMO_PASSWORD}
                {copied === DEMO_PASSWORD ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </p>
          </div>
          <p className="mt-1 text-xs text-ink-500">Cliquez sur un compte pour remplir le formulaire.</p>

          <ul className="mt-4 space-y-2">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              const selected = email === account.email;
              return (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => fillAccount(account.email)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                      selected ? "border-terra-400 bg-terra-50/60" : "border-sand-200 hover:border-sand-300 hover:bg-sand-50",
                    )}
                  >
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", account.tone)}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink-900">{account.role}</span>
                      <span className="mt-0.5 block break-all font-mono text-[13px] text-ink-700">{account.email}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">{account.text}</span>
                    </span>
                    {selected ? (
                      <Check size={18} className="shrink-0 text-terra-600" />
                    ) : (
                      <span className="hidden shrink-0 text-xs font-semibold text-terra-700 sm:block">Utiliser</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </AuthLayout>
  );
}
