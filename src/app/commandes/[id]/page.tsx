"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Banknote, Bike, KeyRound, Check, ClipboardCheck, CreditCard, MapPin, PackageCheck, Phone, ReceiptText, Truck, XCircle } from "lucide-react";
import api from "@/lib/axios";
import LiveMap from "@/components/LiveMap";
import { deliveryLabel, timeOf, type Delivery } from "@/lib/deliveries";
import { useAppSelector } from "@/lib/hooks";
import { SiteShell } from "@/components/MarketLocalUI";
import { Alert, apiError, Button, ButtonLink, Card, cn, EmptyState, formatDate, money, Skeleton, StatusBadge, Textarea } from "@/components/ui";

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
  frais_livraison?: string | number;
  mode_paiement?: "carte" | "livraison";
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  adresse_livraison?: string | null;
  ville_livraison?: string | null;
  telephone_livraison?: string | null;
  items: OrderItem[];
  deliveries?: Delivery[];
}

const cardSteps = [
  { key: "payee", label: "Payée", text: "Les vendeurs préparent vos articles", icon: CreditCard },
  { key: "expediee", label: "Expédiée", text: "Votre colis est en route", icon: Truck },
  { key: "livree", label: "Livrée", text: "Bonne découverte !", icon: PackageCheck },
];

// Paiement à la livraison : pas d'étape « payée », la commande est confirmée dès sa création.
const codSteps = [
  { key: "en_attente", label: "Confirmée", text: "Les vendeurs préparent vos articles", icon: ClipboardCheck },
  { key: "expediee", label: "Expédiée", text: "Préparez le montant en espèces", icon: Truck },
  { key: "livree", label: "Livrée et réglée", text: "Bonne découverte !", icon: PackageCheck },
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
    if (order?.statut !== "en_attente" || order.mode_paiement === "livraison") return;
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
  }, [order?.statut, order?.mode_paiement, id]);

  // Course livreur en cours : on rafraîchit le suivi toutes les 20 secondes.
  const courseActive = (order?.deliveries || []).some((d) => ["disponible", "acceptee", "en_route"].includes(d.statut));
  useEffect(() => {
    if (!courseActive) return;
    const t = setInterval(() => {
      api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => {});
    }, 20000);
    return () => clearInterval(t);
  }, [courseActive, id]);

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
  const cod = order.mode_paiement === "livraison";
  const steps = cod ? codSteps : cardSteps;
  const current = !cod && order.statut === "en_attente" ? -1 : steps.findIndex((s) => s.key === order.statut);

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
        {cod && order.statut !== "annulee" && order.statut !== "livree" && (
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-olive-200 bg-olive-50 p-5">
            <Banknote size={22} className="shrink-0 text-olive-700" />
            <div>
              <p className="font-semibold text-olive-800">Paiement à la livraison</p>
              <p className="mt-0.5 text-sm text-ink-600">Vous réglerez {money(order.total)} en espèces à la réception{order.items.length > 1 ? " (chaque vendeur encaisse sa part)" : ""}.</p>
            </div>
          </div>
        )}

        {!cod && order.statut === "en_attente" && isBuyer && (
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
              <p className="text-sm text-ink-600">
                {cod ? "Aucun paiement n’a été encaissé pour cette commande." : "Si vous aviez payé, le remboursement est effectué sur votre moyen de paiement."}
              </p>
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

        {(order.deliveries || []).filter((d) => d.statut !== "annulee").length > 0 && (
          <section className="mt-8 space-y-4" aria-label="Livraison par livreur">
            {(order.deliveries || [])
              .filter((d) => d.statut !== "annulee")
              .map((d) => (
                <DeliveryCard key={d.id} delivery={d} isBuyer={isBuyer} onChange={(updated) => setOrder((o) => (o ? { ...o, deliveries: (o.deliveries || []).map((x) => (x.id === updated.id ? updated : x)) } : o))} />
              ))}
          </section>
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
            {Number(order.frais_livraison) > 0 && (
              <div className="flex justify-between border-t border-sand-100 px-6 py-3 text-sm">
                <span className="text-ink-600">Frais de livraison</span>
                <span className="font-semibold tabular-nums">{money(order.frais_livraison)}</span>
              </div>
            )}
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
            <p className="mt-4 flex gap-3 text-sm text-ink-700">
              {cod ? <Banknote size={17} className="mt-0.5 shrink-0 text-ink-500" /> : <CreditCard size={17} className="mt-0.5 shrink-0 text-ink-500" />}
              {cod ? "Paiement à la livraison" : "Carte bancaire"}
            </p>
            <p className="mt-6 border-t border-sand-100 pt-4 text-xs leading-relaxed text-ink-500">
              Une commande multi-boutiques est expédiée par chaque vendeur : le statut de chaque article est indiqué à gauche.
            </p>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}

/** Suivi d'une course livreur (un colis par boutique) et code de remise pour l'acheteur. */
function DeliveryCard({ delivery: d, isBuyer, onChange }: { delivery: Delivery; isBuyer: boolean; onChange: (d: Delivery) => void }) {
  const [reporting, setReporting] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const etapes = [
    { label: "Course publiée", at: d.created_at },
    { label: d.livreur ? `Acceptée par ${d.livreur.name}` : "Acceptée par un livreur", at: d.accepted_at },
    { label: "Colis récupéré", at: d.picked_up_at },
    { label: "Remis par le livreur", at: d.delivered_at },
    { label: d.recu_confirme_auto ? "Réception confirmée (auto)" : "Réception confirmée", at: d.recu_confirme_at },
  ];

  const answer = async (action: "confirmer" | "signaler") => {
    setBusy(true);
    setError("");
    try {
      const r = await api.post(`/commandes/livraisons/${d.id}/${action}`, action === "signaler" ? { message } : {});
      onChange(r.data);
      setReporting(false);
    } catch (err) {
      setError(apiError(err, "Action impossible."));
    } finally {
      setBusy(false);
    }
  };

  const waitingBuyer = isBuyer && d.statut === "livree" && !d.recu_confirme_at && !d.probleme_signale_at;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink-900">
            <Bike size={18} className="text-terra-600" /> Livraison {d.shop ? `· ${d.shop.nom}` : ""}
          </p>
          <p className="mt-1 text-sm text-ink-600">{deliveryLabel[d.statut]}</p>
          {d.livreur?.telephone && d.statut !== "livree" && (
            <a href={`tel:${d.livreur.telephone}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-terra-700 hover:underline">
              <Phone size={14} /> Appeler {d.livreur.name}
            </a>
          )}
        </div>
        {isBuyer && d.code && d.statut !== "livree" && (
          <div className="rounded-2xl border-2 border-dashed border-terra-300 bg-terra-50 px-5 py-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-terra-700">
              <KeyRound size={13} /> Code à donner au livreur
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-[0.35em] text-ink-900">{d.code}</p>
          </div>
        )}
      </div>
      {d.position && (
        <div className="mt-5">
          <LiveMap lat={d.position.lat} lng={d.position.lng} label={`Position de ${d.livreur?.name || "votre livreur"}`} />
          <p className="mt-2 text-xs text-ink-500">Position du livreur mise à jour {timeOf(d.position.at)} · actualisation toutes les 20 secondes</p>
        </div>
      )}
      {waitingBuyer && (
        <div className="mt-5 rounded-2xl border border-olive-200 bg-olive-50 p-4">
          <p className="font-semibold text-olive-800">Le livreur indique avoir remis votre colis.</p>
          <p className="mt-0.5 text-sm text-ink-600">
            Confirmez la réception, ou signalez un problème
            {d.confirmation_limite_at ? ` avant le ${timeOf(d.confirmation_limite_at)} (ensuite, la réception est confirmée automatiquement)` : ""}.
          </p>
          {reporting ? (
            <div className="mt-3 space-y-3">
              <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex. colis abîmé, article manquant, pas reçu…" aria-label="Décrivez le problème" />
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" onClick={() => answer("signaler")} loading={busy} disabled={message.trim().length < 5}>Envoyer le signalement</Button>
                <Button variant="ghost" onClick={() => setReporting(false)} disabled={busy}>Annuler</Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="success" onClick={() => answer("confirmer")} loading={busy}><Check size={16} /> J’ai bien reçu ma commande</Button>
              <Button variant="outline" onClick={() => setReporting(true)} disabled={busy}>Signaler un problème</Button>
            </div>
          )}
          {error && <Alert className="mt-3">{error}</Alert>}
        </div>
      )}
      {d.probleme_signale_at && !d.litige_resolu_at && (
        <Alert className="mt-5">
          Problème signalé {timeOf(d.probleme_signale_at)}{d.probleme_signale ? ` : « ${d.probleme_signale} »` : ""}. L’équipe MarketLocal examine votre demande.
        </Alert>
      )}
      {d.litige_resolu_at && (
        <Alert tone={d.litige_resolution === "remboursement" ? "success" : "info"} className="mt-5">
          {d.litige_resolution === "remboursement"
            ? `Litige réglé ${timeOf(d.litige_resolu_at)} : vous êtes remboursé de ${money(d.rembourse_montant)}${d.mode_paiement === "carte" ? " sur votre carte (quelques jours selon votre banque)." : ". L’équipe vous contacte pour le remboursement."}`
            : `Litige clos ${timeOf(d.litige_resolu_at)} : après vérification, la livraison est considérée comme effectuée.`}
          {d.litige_note && <span className="mt-1 block text-xs opacity-80">Message de l’équipe : {d.litige_note}</span>}
        </Alert>
      )}
      <ol className="mt-5 grid gap-3 sm:grid-cols-5">
        {etapes.map((e) => (
          <li key={e.label} className="flex items-start gap-2.5 text-sm">
            <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", e.at ? "bg-olive-500" : "bg-sand-300")} />
            <span>
              <span className={cn("block font-semibold", e.at ? "text-ink-900" : "text-ink-400")}>{e.label}</span>
              {e.at && <span className="text-xs text-ink-500">{timeOf(e.at)}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
