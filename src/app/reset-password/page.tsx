"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import api from "@/lib/axios";
import AuthLayout from "@/components/AuthLayout";
import { Alert, apiError, Button, Field, Input } from "@/components/ui";

// Page ouverte depuis le lien de l'e-mail : /reset-password?token=...&email=...
export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <h1 className="font-display text-4xl font-semibold text-ink-900">Nouveau mot de passe</h1>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await api.post("/mot-de-passe/reinitialiser", { token, email, password, password_confirmation: confirmation });
      setDone(r.data.message);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(apiError(err, "Impossible de modifier le mot de passe."));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <>
        <Alert className="mt-8">Ce lien est incomplet. Faites une nouvelle demande de réinitialisation.</Alert>
        <p className="mt-6 text-center text-sm">
          <Link href="/mot-de-passe-oublie" className="font-semibold text-terra-700 hover:underline">Mot de passe oublié</Link>
        </p>
      </>
    );
  }

  if (done) {
    return (
      <Alert tone="success" className="mt-8">
        {done}{" "}
        <Link href="/login" className="font-semibold underline">Se connecter</Link>
      </Alert>
    );
  }

  return (
    <>
      <p className="mt-2 text-[15px] text-ink-500">
        Compte : <span className="font-semibold text-ink-800">{email}</span>
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field label="Nouveau mot de passe" hint="8 caractères minimum.">
          <Input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirmer le mot de passe">
          <Input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </Field>
        {error && (
          <Alert>
            {error}{" "}
            <Link href="/mot-de-passe-oublie" className="font-semibold underline">Nouvelle demande</Link>
          </Alert>
        )}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <KeyRound size={18} /> Enregistrer le mot de passe
        </Button>
      </form>
    </>
  );
}
