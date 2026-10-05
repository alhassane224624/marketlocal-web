"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Lock, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";
import { CheckoutSteps, SiteShell } from "@/components/MarketLocalUI";
import { Alert, apiError, Button, Card, money, Skeleton } from "@/components/ui";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Formulaire Stripe aux couleurs de MarketLocal.
const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#a74a23",
    colorText: "#1f1a16",
    colorTextSecondary: "#6f665d",
    colorDanger: "#b91c1c",
    colorBackground: "#ffffff",
    fontFamily: "Manrope, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #dccdb7", boxShadow: "none" },
    ".Input:focus": { border: "1px solid #d6744a", boxShadow: "0 0 0 4px #f8dfd1" },
    ".Label": { fontWeight: "600", color: "#423a33" },
  },
};

interface OrderSummary {
  id: number;
  total: string;
  ville_livraison?: string | null;
  items: { id: number; quantite: number; prix_unitaire: string; product: { nom: string } }[];
}

function CheckoutForm({ orderId, total }: { orderId: string; total?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !ready) return;
    setLoading(true);
    setError("");
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/commandes/${orderId}` },
    });
    if (result.error) setError(result.error.message || "Le paiement a échoué.");
    else router.push(`/commandes/${orderId}`);
    setLoading(false);
  };

  return (
    <form onSubmit={submit}>
      {!ready && <Skeleton className="mb-4 h-48" />}
      <PaymentElement
        onReady={() => setReady(true)}
        onLoadError={(e) => setError(e.error?.message || "Impossible de charger le formulaire de paiement.")}
      />
      {error && <Alert className="mt-5">{error}</Alert>}
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={!stripe || !ready} loading={loading}>
        <Lock size={16} />
        {loading ? "Paiement en cours…" : `Payer ${total ? money(total) : "la commande"}`}
      </Button>
    </form>
  );
}

export default function PaiementPage() {
  const id = String(useParams().id);
  const [secret, setSecret] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .post(`/orders/${id}/payer`)
      .then((r) => setSecret(r.data.client_secret))
      .catch((e) => setError(apiError(e, "Impossible d’initialiser le paiement.")));
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => {});
  }, [id]);

  return (
    <SiteShell footer={false}>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <CheckoutSteps current={1} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <h1 className="font-display text-4xl font-semibold text-ink-900">Paiement</h1>
            <p className="mt-2 flex items-center gap-2 text-[15px] text-ink-500">
              <ShieldCheck size={16} className="text-olive-600" /> Vos données bancaires sont traitées par Stripe, jamais par MarketLocal.
            </p>

            <Card className="mt-8 p-6">
              {!stripePromise ? (
                <Alert tone="info">
                  La clé publique Stripe n’est pas configurée (<code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>).
                </Alert>
              ) : error ? (
                <div className="space-y-4">
                  <Alert>{error}</Alert>
                  <Link href={`/commandes/${id}`} className="inline-block text-sm font-semibold text-terra-700 hover:underline">
                    Voir la commande #{id}
                  </Link>
                </div>
              ) : !secret ? (
                <Skeleton className="h-56" />
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance, locale: "fr", fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" }] }}>
                  <CheckoutForm orderId={id} total={order?.total} />
                </Elements>
              )}
            </Card>
            {stripeKey?.startsWith("pk_test") && (
              <p className="mt-4 text-sm text-ink-500">
                Mode test : utilisez la carte <code className="rounded bg-sand-100 px-1.5 py-0.5 font-semibold text-ink-800">4242 4242 4242 4242</code>, une date future et n’importe quel CVC.
              </p>
            )}
          </div>

          <aside className="lg:pt-[5.5rem]">
            <Card className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Commande #{id}</p>
              {order ? (
                <>
                  <ul className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4 text-sm">
                        <span className="text-ink-700">
                          {item.product.nom} <span className="text-ink-500">× {item.quantite}</span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">{money(Number(item.prix_unitaire) * item.quantite)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-baseline justify-between border-t border-sand-200 pt-4">
                    <span className="font-semibold">Total</span>
                    <span className="font-display text-2xl font-semibold tabular-nums">{money(order.total)}</span>
                  </div>
                  {order.ville_livraison && <p className="mt-3 text-xs text-ink-500">Livraison à {order.ville_livraison}</p>}
                </>
              ) : (
                <Skeleton className="mt-4 h-24" />
              )}
            </Card>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
