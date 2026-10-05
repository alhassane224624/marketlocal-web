"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, Package, Pencil, Percent, RefreshCw, ShieldCheck, Store } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMyShop } from "@/features/shop/shopSlice";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import ShopForm from "@/components/ShopForm";
import {
  Alert,
  apiError,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  LoadingRows,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui";

const kycLabel: Record<string, { label: string; tone: "olive" | "saffron" | "ink" }> = {
  verified: { label: "Compte vérifié", tone: "olive" },
  pending: { label: "Vérification en cours", tone: "saffron" },
  not_started: { label: "Non configuré", tone: "ink" },
};

export default function MaBoutiquePage() {
  const dispatch = useAppDispatch();
  const { shop } = useAppSelector((state) => state.shop);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeMessage, setStripeMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    dispatch(fetchMyShop()).finally(() => setLoaded(true));
  }, [dispatch]);

  const save = async (values: { nom: string; description: string; logo: File | null }) => {
    setSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append("nom", values.nom);
      formData.append("description", values.description);
      if (values.logo) formData.append("logo", values.logo);
      formData.append("_method", "PUT"); // Laravel ne lit pas le multipart en PUT
      await api.post("/shops/mine", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await dispatch(fetchMyShop());
      setEditing(false);
    } catch (err) {
      setSaveError(apiError(err, "Impossible de modifier la boutique."));
    } finally {
      setSaving(false);
    }
  };

  const startStripe = async () => {
    setStripeLoading(true);
    setStripeMessage(null);
    try {
      const { data } = await api.post("/shop/stripe/onboard", {
        refresh_url: `${window.location.origin}/ma-boutique?stripe=refresh`,
        return_url: `${window.location.origin}/ma-boutique?stripe=return`,
      });
      window.location.href = data.url;
    } catch (err) {
      setStripeMessage({ tone: "error", text: apiError(err, "Impossible de démarrer Stripe.") });
      setStripeLoading(false);
    }
  };

  const refreshStripe = async () => {
    setStripeLoading(true);
    setStripeMessage(null);
    try {
      await api.get("/shop/stripe/status");
      const { data } = await api.post("/shop/stripe/settle-pending");
      await dispatch(fetchMyShop());
      setStripeMessage({
        tone: "success",
        text: data.transferts_effectues ? `${data.transferts_effectues} versement(s) effectué(s).` : "Statut à jour, aucun versement en attente.",
      });
    } catch (err) {
      setStripeMessage({ tone: "error", text: apiError(err, "Impossible de vérifier Stripe.") });
    } finally {
      setStripeLoading(false);
    }
  };

  if (!shop) {
    return (
      <DashboardLayout>
        <PageHeader eyebrow="Espace vendeur" title="Ma boutique" />
        {loaded ? (
          <EmptyState icon={Store} title="Vous n’avez pas encore de boutique" description="Créez-la en quelques minutes." action={<ButtonLink href="/shop/create">Créer ma boutique</ButtonLink>} />
        ) : (
          <LoadingRows />
        )}
      </DashboardLayout>
    );
  }

  const kyc = kycLabel[shop.kyc_status || "not_started"] || kycLabel.not_started;
  const products = shop.products || [];

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Espace vendeur"
        title="Ma boutique"
        description="Votre vitrine publique et vos paiements."
        actions={
          shop.statut === "valide" && (
            <ButtonLink href={`/catalogue?shop=${shop.id}`} variant="outline">
              <ExternalLink size={16} /> Voir la vitrine
            </ButtonLink>
          )
        }
      />

      {/* Vitrine */}
      <Card className="overflow-hidden">
        <div className="zellige h-28 bg-terra-100" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-sand-100 shadow-soft">
              {shop.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-semibold text-terra-700">{shop.nom.charAt(0)}</span>
              )}
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil size={14} /> Modifier
              </Button>
            )}
          </div>

          {editing ? (
            <div className="mt-6 max-w-2xl">
              <ShopForm
                initial={{ nom: shop.nom, description: shop.description }}
                currentLogo={shop.logo}
                submitLabel="Enregistrer"
                loading={saving}
                error={saveError}
                onSubmit={save}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-3xl font-semibold text-ink-900">{shop.nom}</h2>
                <StatusBadge status={shop.statut} label={shop.statut === "en_attente" ? "En attente de validation" : undefined} />
              </div>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
                {shop.description || "Ajoutez une présentation pour donner envie aux acheteurs."}
              </p>
            </>
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Produits" value={products.length} icon={Package} tone="terra" hint={`${products.filter((p: { stock: number }) => p.stock === 0).length} en rupture`} />
        <StatCard label="Commission plateforme" value={`${Number(shop.commission ?? 10)} %`} icon={Percent} tone="ink" hint="Prélevée sur chaque vente" />
        <StatCard label="Paiements" value={kyc.label} icon={CreditCard} tone={kyc.tone === "olive" ? "olive" : "saffron"} />
      </div>

      {/* Stripe Connect */}
      <Card className="mt-6">
        <CardHeader
          title="Recevoir vos paiements"
          description="Les ventes sont versées sur votre compte via Stripe Connect, commission déduite."
          icon={ShieldCheck}
          action={<Badge tone={kyc.tone}>{kyc.label}</Badge>}
        />
        <div className="space-y-4 p-5">
          {shop.statut !== "valide" ? (
            <p className="text-sm text-ink-500">Disponible une fois votre boutique validée par l’équipe.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {!shop.is_active && (
                <Button onClick={startStripe} loading={stripeLoading}>
                  <CreditCard size={16} /> {shop.stripe_account_id ? "Reprendre la configuration" : "Configurer Stripe"}
                </Button>
              )}
              {shop.stripe_account_id && (
                <Button variant="outline" onClick={refreshStripe} loading={stripeLoading}>
                  <RefreshCw size={16} /> Actualiser et verser les ventes en attente
                </Button>
              )}
            </div>
          )}
          {stripeMessage && <Alert tone={stripeMessage.tone}>{stripeMessage.text}</Alert>}
        </div>
      </Card>
    </DashboardLayout>
  );
}
