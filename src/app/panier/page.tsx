"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Lock, MapPin, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearCart, decrementQuantity, incrementQuantity, removeFromCart } from "@/features/cart/cartSlice";
import api from "@/lib/axios";
import { CheckoutSteps, ProductVisual, SiteShell } from "@/components/MarketLocalUI";
import { Alert, apiError, Button, ButtonLink, Card, cn, EmptyState, Field, Input, money } from "@/components/ui";

interface Address {
  id: number;
  libelle?: string | null;
  nom_destinataire: string;
  telephone: string;
  adresse: string;
  ville: string;
  est_par_defaut: boolean;
}

export default function PanierPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((s) => s.cart);
  const { token, user } = useAppSelector((s) => s.auth);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    libelle: "Domicile",
    nom_destinataire: user?.name || "",
    telephone: user?.telephone || "",
    adresse: user?.adresse || "",
    ville: user?.ville || "",
  });

  const total = useMemo(() => items.reduce((s, i) => s + i.prix * i.quantite, 0), [items]);
  const count = items.reduce((s, i) => s + i.quantite, 0);
  const shopCount = new Set(items.map((i) => i.shop_nom)).size;

  useEffect(() => {
    if (!token) return;
    api
      .get("/addresses")
      .then((r) => {
        const list: Address[] = r.data.data || r.data || [];
        setAddresses(list);
        const def = list.find((a) => a.est_par_defaut) || list[0];
        if (def) setAddressId(def.id);
      })
      .catch(() => {});
  }, [token]);

  const createAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    setError("");
    try {
      const r = await api.post("/addresses", { ...form, est_par_defaut: addresses.length === 0 });
      const a = r.data.data || r.data;
      setAddresses((old) => [...old, a]);
      setAddressId(a.id);
      setShowAddressForm(false);
    } catch (err) {
      setError(apiError(err, "Impossible d’enregistrer l’adresse."));
    } finally {
      setAddressLoading(false);
    }
  };

  const checkout = async () => {
    if (!token) {
      router.push("/login?redirect=/panier");
      return;
    }
    if (user && user.role !== "acheteur") {
      setError("Seul un compte acheteur peut passer commande.");
      return;
    }
    if (!addressId && addresses.length === 0 && !form.adresse) {
      setError("Ajoutez une adresse de livraison avant de commander.");
      setShowAddressForm(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        items: items.map((i) => ({ product_id: i.product_id, quantite: i.quantite })),
      };
      if (addressId) payload.address_id = addressId;
      else {
        payload.adresse_livraison = form.adresse;
        payload.ville_livraison = form.ville;
        payload.telephone_livraison = form.telephone;
      }
      const r = await api.post("/orders", payload);
      dispatch(clearCart());
      router.push(`/paiement/${r.data.id}`);
    } catch (err) {
      setError(apiError(err, "Impossible de créer la commande. Vérifiez le stock."));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl px-4 py-24">
          <EmptyState
            icon={ShoppingBag}
            title="Votre panier est vide"
            description="Parcourez le catalogue et ajoutez les pièces qui vous plaisent."
            action={
              <ButtonLink href="/catalogue">
                Explorer le catalogue <ArrowRight size={16} />
              </ButtonLink>
            }
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <CheckoutSteps current={0} />
        <div className="mb-8 mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-ink-900">Votre panier</h1>
            <p className="mt-2 text-[15px] text-ink-500">
              {count} article{count > 1 ? "s" : ""} · {shopCount} boutique{shopCount > 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/catalogue" className="text-sm font-semibold text-terra-700 hover:underline">
            Continuer mes achats
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <Card>
              <ul className="divide-y divide-sand-100">
                {items.map((item) => (
                  <li key={item.product_id} className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                    <Link href={`/catalogue/${item.product_id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                      <ProductVisual product={{ image: item.image, nom: item.nom, category: item.categorie ? { nom: item.categorie } : null }} />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/catalogue/${item.product_id}`} className="line-clamp-2 font-display text-lg font-semibold leading-snug text-ink-900 hover:text-terra-700">
                            {item.nom}
                          </Link>
                          <p className="mt-0.5 text-[13px] text-ink-500">{item.shop_nom}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(item.product_id))}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 transition hover:bg-red-50 hover:text-red-700"
                          aria-label={`Retirer ${item.nom}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                        <div className="flex h-10 items-center rounded-full border border-sand-300">
                          <button type="button" onClick={() => dispatch(decrementQuantity(item.product_id))} className="grid h-full w-10 place-items-center text-ink-600 hover:text-ink-900" aria-label="Diminuer">
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantite}</span>
                          <button
                            type="button"
                            onClick={() => dispatch(incrementQuantity(item.product_id))}
                            disabled={item.quantite >= item.stock}
                            className="grid h-full w-10 place-items-center text-ink-600 hover:text-ink-900 disabled:opacity-30"
                            aria-label="Augmenter"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-ink-900 tabular-nums">{money(item.prix * item.quantite)}</p>
                          {item.quantite > 1 && <p className="text-xs text-ink-500">{money(item.prix)} l’unité</p>}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {token && user?.role === "acheteur" && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink-900">
                    <MapPin size={20} className="text-terra-600" /> Livraison
                  </h2>
                  {!showAddressForm && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAddressForm(true)}>
                      <Plus size={14} /> Nouvelle adresse
                    </Button>
                  )}
                </div>

                {addresses.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Adresse de livraison">
                    {addresses.map((a) => {
                      const selected = addressId === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setAddressId(a.id)}
                          className={cn(
                            "relative rounded-2xl border-2 bg-white p-4 text-left transition",
                            selected ? "border-terra-500 shadow-soft" : "border-sand-200 hover:border-sand-300",
                          )}
                        >
                          <span className={cn("absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border-2", selected ? "border-terra-600 bg-terra-600 text-white" : "border-sand-300")}>
                            {selected && <Check size={12} strokeWidth={3} />}
                          </span>
                          <p className="text-sm font-semibold text-ink-900">{a.libelle || "Adresse"}</p>
                          <p className="mt-1 text-sm text-ink-600">{a.nom_destinataire}</p>
                          <p className="text-sm text-ink-600">{a.adresse}, {a.ville}</p>
                          <p className="text-sm text-ink-500">{a.telephone}</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {(showAddressForm || addresses.length === 0) && (
                  <Card className="mt-4 p-5">
                    <form onSubmit={createAddress} className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center justify-between sm:col-span-2">
                        <p className="font-semibold text-ink-900">Ajouter une adresse</p>
                        {addresses.length > 0 && (
                          <button type="button" onClick={() => setShowAddressForm(false)} className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-sand-100" aria-label="Annuler">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <Field label="Libellé"><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Domicile, bureau…" /></Field>
                      <Field label="Destinataire"><Input required value={form.nom_destinataire} onChange={(e) => setForm({ ...form, nom_destinataire: e.target.value })} /></Field>
                      <Field label="Adresse" className="sm:col-span-2"><Input required value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Numéro, rue, quartier" /></Field>
                      <Field label="Ville"><Input required value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} /></Field>
                      <Field label="Téléphone"><Input required type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Field>
                      <div className="sm:col-span-2">
                        <Button type="submit" variant="dark" loading={addressLoading}>Enregistrer l’adresse</Button>
                      </div>
                    </form>
                  </Card>
                )}
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <h2 className="font-display text-2xl font-semibold text-ink-900">Récapitulatif</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-ink-600">Sous-total</dt><dd className="font-semibold tabular-nums">{money(total)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-600">Livraison</dt><dd className="text-ink-600">Gérée par chaque vendeur</dd></div>
                <div className="flex items-baseline justify-between border-t border-sand-200 pt-4">
                  <dt className="font-semibold text-ink-900">Total</dt>
                  <dd className="font-display text-3xl font-semibold text-ink-900 tabular-nums">{money(total)}</dd>
                </div>
              </dl>
              {error && <Alert className="mt-5">{error}</Alert>}
              <Button size="lg" className="mt-6 w-full" onClick={checkout} loading={loading}>
                {token ? "Valider et payer" : "Se connecter pour commander"}
                {!loading && <ArrowRight size={18} />}
              </Button>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-500">
                <Lock size={13} /> Paiement sécurisé par Stripe · stock réservé 30 min
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
