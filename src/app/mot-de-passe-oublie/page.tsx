"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import api from "@/lib/axios";
import AuthLayout from "@/components/AuthLayout";
import { Alert, apiError, Button, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await api.post("/mot-de-passe/oublie", { email });
      setSent(r.data.message);
    } catch (err) {
      setError(apiError(err, "Impossible d’envoyer l’e-mail. Réessayez."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-4xl font-semibold text-ink-900">Mot de passe oublié</h1>
      <p className="mt-2 text-[15px] text-ink-500">
        Indiquez l’adresse de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </p>

      {sent ? (
        <Alert tone="success" className="mt-8">
          {sent} Pensez à regarder dans vos courriers indésirables.
        </Alert>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field label="Adresse e-mail">
            <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ma" />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            <Mail size={18} /> Envoyer le lien
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-terra-700 hover:underline">
          <ArrowLeft size={14} /> Retour à la connexion
        </Link>
      </p>
    </AuthLayout>
  );
}
