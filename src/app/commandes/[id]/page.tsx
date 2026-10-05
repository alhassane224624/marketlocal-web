"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, CreditCard, MapPin, PackageCheck, Phone, ReceiptText, Truck, XCircle } from "lucide-react";
import api from "@/lib/axios";
import { useAppSelector } from "@/lib/hooks";
import { SiteShell } from "@/components/MarketLocalUI";
import { apiError, ButtonLink, Card, cn, EmptyState, formatDate, money, Skeleton, StatusBadge } from "@/components/ui";

interface OrderItem {
  id: number;
  quantite: number;
  prix_unitaire: string;
  statut: string;
  product: { id: number | null; nom: string };
}

interface Order {
  id: number;
  buyer_id: number;
  statut: string;
  total: string;
  created_at: string;
  updated_at: string;
  adresse_livraison?: string | null;
  ville_livraison?: string | null;
  telephone_livraison?: string | null;
  items: OrderItem[];
}

const steps = [
  { key: "payee", label: "Payée", text: "Les vendeurs préparent vos articles", icon: CreditCard },
  { key: "expediee", label: "Expédiée", text: "Votre colis est en route", icon: Truck },
  { key: "livree", label: "Livrée", text: "Bonne découverte !", icon: PackageCheck },
];

export default function OrderDetailPage() {
  const id = String(useParams().id);
  const { user } = useAppSelector((s) => s.auth);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError(apiError(e, "Commande introuvable.")))
      .finally(() => setLoading(false));
  }, [id]);

  // Juste après le paiement, le webhook Stripe peut mettre quelques secondes à arriver.
  useEffect(() => {
    if (order?.statut !== "en_attente") return;
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      api
        .get(`/orders/${id}`)
        .then((r) => setOrder(r.data))
        .catch(() => {});
      if (tries >= 10) clearInterval(t);
    }, 3000);
    return () => clearInterval(t);
  }, [order?.statut, id]);

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </SiteShell>
    );
  }

  if (!order) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl px-4 py-24">
          <EmptyState icon={ReceiptText} title="Commande introuvable" description={error} action={<ButtonLink href="/dashboard">Retour à mon espace</ButtonLink>} />
        </div>
      </SiteShell>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const cancelled = order.statut === "annulee";
  const current = order.statut === "en_attente" ? -1 : steps.findIndex((s) => s.key === order.statut);

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link href={isBuyer ? "/mes-commandes" : "/dashboard"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900">
          <ArrowLeft size={16} /> {isBuyer ? "Mes commandes" : "Mon espace"}
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-terra-600">Suivi de commande</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">Commande #{order.id}</h1>
            <p className="mt-2 text-[15px] text-ink-500">Passée le {formatDate(order.created_at, true)}</p>
          </div>
          <StatusBadge status={order.statut} />
        </div>

        {/* Bandeau d'état */}
        {order.statut === "en_attente" && isBuyer && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-saffron-100 bg-saffron-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-saffron-700">En attente de paiement</p>
              <p className="mt-0.5 text-sm text-ink-600">Le stock est réservé 30 minutes. Passé ce délai, la commande est annulée.</p>
            </div>
            <ButtonLink href={`/paiement/${order.id}`}>
              <CreditCard size={16} /> Payer {money(order.total)}
            </ButtonLink>
          </div>
        )}

        {cancelled ? (
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
            <XCircle size={22} className="shrink-0 text-red-700" />
            <div>
              <p className="font-semibold text-red-800">Commande annulée</p>
              <p className="text-sm text-ink-600">Si vous aviez payé, le remboursement est effectué sur votre moyen de paiement.</p>
            </div>
          </div>
        ) : (
          <Card className="mt-8 p-6 sm:p-8">
            <ol className="grid gap-6 sm:grid-cols-3 sm:gap-4">
              {steps.map((step, i) => {
                const done = current >= i;
                const Icon = step.icon;
                return (
                  <li key={step.key} className="relative flex gap-4 sm:flex-col sm:gap-3">
                    {i < steps.length - 1 && (
                      <span className={cn("absolute left-5 top-12 h-[calc(100%-1.5rem)] w-0.5 sm:left-12 sm:right-0 sm:top-5 sm:h-0.5 sm:w-auto", current > i ? "bg-olive-500" : "bg-sand-200")} aria-hidden />
                    )}
                    <span className={cn("relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full", done ? "bg-olive-600 text-white" : "bg-sand-100 text-ink-400")}>
                      {done ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
                    </span>
                    <div>
                      <p className={cn("font-semibold", done ? "text-ink-900" : "text-ink-500")}>{step.label}</p>
                      <p className="mt-0.5 text-sm text-ink-500">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <Card>
            <div className="border-b border-sand-100 px-6 py-4">
              <h2 className="font-semibold text-ink-900">Articles ({order.items.length})</h2>
            </div>
            <ul className="divide-y divide-sand-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    {item.product.id ? (
                      <Link href={`/catalogue/${item.product.id}`} className="font-semibold text-ink-900 hover:text-terra-700">{item.product.nom}</Link>
                    ) : (
                      <p className="font-semibold text-ink-900">{item.product.nom}</p>
                    )}
                    <p className="mt-0.5 text-sm text-ink-500">{money(item.prix_unitaire)} × {item.quantite}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={item.statut} />
                    <p className="w-28 text-right font-semibold tabular-nums">{money(Number(item.prix_unitaire) * item.quantite)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-sand-200 px-6 py-5">
              <span className="font-semibold">Total</span>
              <span className="font-display text-3xl font-semibold tabular-nums">{money(order.total)}</span>
            </div>
          </Card>

          <Card className="h-fit p-6">
            <h2 className="font-semibold text-ink-900">Livraison</h2>
            <div className="mt-4 space-y-3 text-sm text-ink-700">
              <p className="flex gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-ink-500" />
                <span>
                  {order.adresse_livraison || "Adresse du profil"}
                  <br />
                  <span className="text-ink-500">{order.ville_livraison || "Ville non renseignée"}</span>
                </span>
              </p>
              {order.telephone_livraison && (
                <p className="flex gap-3">
                  <Phone size={17} className="mt-0.5 shrink-0 text-ink-500" />
                  {order.telephone_livraison}
                </p>
              )}
            </div>
            <p className="mt-6 border-t border-sand-100 pt-4 text-xs leading-relaxed text-ink-500">
              Une commande multi-boutiques est expédiée par chaque vendeur : le statut de chaque article est indiqué à gauche.
            </p>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
