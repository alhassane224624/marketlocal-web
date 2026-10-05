"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ShoppingBag, Store } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { register } from "@/features/auth/authSlice";
import AuthLayout from "@/components/AuthLayout";
import { Alert, Button, cn, Field, Input } from "@/components/ui";

const roles = [
  { value: "acheteur", label: "Je veux acheter", text: "Découvrir et commander des produits locaux", icon: ShoppingBag },
  { value: "vendeur", label: "Je veux vendre", text: "Ouvrir ma boutique et publier mes produits", icon: Store },
] as const;

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}

function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const { status, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: params.get("role") === "vendeur" ? "vendeur" : "acheteur",
  });

  const mismatch = form.password_confirmation.length > 0 && form.password !== form.password_confirmation;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    const r = await dispatch(register(form));
    if (register.fulfilled.match(r)) router.push(form.role === "vendeur" ? "/shop/create" : "/dashboard");
  };

  return (
    <>
      <h1 className="font-display text-4xl font-semibold text-ink-900">Créer un compte</h1>
      <p className="mt-2 text-[15px] text-ink-500">Quelques informations suffisent pour commencer.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink-700">Vous êtes ici pour…</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
            {roles.map((role) => {
              const Icon = role.icon;
              const selected = form.role === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setForm({ ...form, role: role.value })}
                  className={cn(
                    "relative rounded-2xl border-2 bg-white p-4 text-left transition",
                    selected ? "border-terra-500 shadow-soft" : "border-sand-200 hover:border-sand-300",
                  )}
                >
                  <span className={cn("grid h-9 w-9 place-items-center rounded-xl", selected ? "bg-terra-600 text-white" : "bg-sand-100 text-ink-600")}>
                    <Icon size={18} />
                  </span>
                  {selected && <Check size={16} strokeWidth={3} className="absolute right-4 top-4 text-terra-600" />}
                  <span className="mt-3 block text-sm font-semibold text-ink-900">{role.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{role.text}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="Nom complet">
          <Input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" />
        </Field>
        <Field label="Adresse e-mail">
          <Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.ma" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Mot de passe" hint="8 caractères minimum">
            <Input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Confirmation" error={mismatch ? "Les mots de passe diffèrent" : undefined}>
            <Input type="password" required autoComplete="new-password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} aria-invalid={mismatch} />
          </Field>
        </div>

        {status === "failed" && error && <Alert>{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" loading={status === "loading"} disabled={mismatch}>
          {form.role === "vendeur" ? "Créer mon compte vendeur" : "Créer mon compte"}
          {status !== "loading" && <ArrowRight size={18} />}
        </Button>
        {form.role === "vendeur" && (
          <p className="text-center text-xs text-ink-500">Vous pourrez ensuite décrire votre boutique ; elle sera publiée après validation.</p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-terra-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
