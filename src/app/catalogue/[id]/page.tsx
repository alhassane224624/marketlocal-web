"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronRight, Minus, PackageX, Plus, ShieldCheck, ShoppingBag, Star, Store, Truck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProduct, type Product } from "@/features/products/productSlice";
import { addToCart } from "@/features/cart/cartSlice";
import api from "@/lib/axios";
import { ProductVisual, SiteShell } from "@/components/MarketLocalUI";
import {
  Alert,
  apiError,
  Avatar,
  Button,
  ButtonLink,
  Card,
  cn,
  EmptyState,
  money,
  Skeleton,
  Stars,
  Textarea,
} from "@/components/ui";

export default function ProductDetailPage() {
  const id = Number(useParams().id);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { current: product, status } = useAppSelector((s) => s.products);
  const { user } = useAppSelector((s) => s.auth);
  const cartItems = useAppSelector((s) => s.cart.items);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchProduct(id));
  }, [dispatch, id]);

  if (status === "failed") {
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl px-4 py-24">
          <EmptyState
            icon={PackageX}
            title="Produit introuvable"
            description="Ce produit n’existe plus ou n’est pas disponible pour le moment."
            action={<ButtonLink href="/catalogue">Retour au catalogue</ButtonLink>}
          />
        </div>
      </SiteShell>
    );
  }

  if (status === "loading" || !product) {
    return (
      <SiteShell>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-28" />
          </div>
        </div>
      </SiteShell>
    );
  }

  const inCart = cartItems.find((i) => i.product_id === product.id);
  const remaining = product.stock - (inCart?.quantite ?? 0);
  const canBuy = !user || user.role === "acheteur";
  const reviews = product.reviews || [];
  const rating = product.note_moyenne ?? (reviews.length ? reviews.reduce((s, r) => s + r.note, 0) / reviews.length : null);

  const add = () => {
    for (let i = 0; i < quantity; i++)
      dispatch(
        addToCart({
          product_id: product.id,
          nom: product.nom,
          prix: Number(product.prix),
          stock: product.stock,
          shop_nom: product.shop?.nom || "Vendeur local",
          image: product.image || undefined,
          categorie: product.category?.nom,
        }),
      );
    setAdded(true);
    setQuantity(1);
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex items-center gap-1.5 py-6 text-sm text-ink-500" aria-label="Fil d’Ariane">
          <Link href="/catalogue" className="hover:text-ink-900">Catalogue</Link>
          {product.category && (
            <>
              <ChevronRight size={14} />
              <Link href={`/catalogue?category=${product.category.id}`} className="hover:text-ink-900">
                {product.category.nom}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="line-clamp-1 text-ink-800">{product.nom}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="aspect-square overflow-hidden rounded-[2rem] border border-sand-200 shadow-soft">
              <ProductVisual product={product} large />
            </div>
          </div>

          <div className="animate-fade-up">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-terra-600">{product.category?.nom || "Produit local"}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">{product.nom}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {rating ? (
                <a href="#avis" className="flex items-center gap-2 text-ink-700 hover:text-ink-900">
                  <Stars value={rating} />
                  <span className="font-semibold">{rating.toFixed(1).replace(".", ",")}</span>
                  <span className="text-ink-500">({reviews.length} avis)</span>
                </a>
              ) : (
                <span className="text-ink-500">Pas encore d’avis</span>
              )}
              <span className="h-4 w-px bg-sand-300" aria-hidden />
              <span className="flex items-center gap-1.5 text-ink-700">
                <Store size={15} /> {product.shop?.nom || "Vendeur local"}
              </span>
            </div>

            <p className="mt-8 font-display text-4xl font-semibold text-ink-900 tabular-nums">{money(product.prix)}</p>
            <p className={cn("mt-2 flex items-center gap-2 text-sm font-semibold", product.stock > 0 ? "text-olive-600" : "text-red-700")}>
              <span className={cn("h-2 w-2 rounded-full", product.stock > 0 ? "bg-olive-500" : "bg-red-600")} />
              {product.stock > 0 ? (product.stock < 5 ? `Plus que ${product.stock} en stock` : "En stock") : "Épuisé"}
            </p>

            <p className="mt-6 text-[15px] leading-relaxed text-ink-600">
              {product.description || "Une pièce proposée par un vendeur local de la marketplace."}
            </p>

            {canBuy && (
              <div className="mt-8 rounded-2xl border border-sand-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex h-12 items-center justify-between rounded-xl border border-sand-300 sm:w-36">
                    <button type="button" aria-label="Diminuer la quantité" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid h-full w-11 place-items-center text-ink-600 hover:text-ink-900">
                      <Minus size={16} />
                    </button>
                    <span className="font-semibold tabular-nums" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Augmenter la quantité"
                      onClick={() => setQuantity((q) => Math.min(Math.max(remaining, 1), q + 1))}
                      className="grid h-full w-11 place-items-center text-ink-600 hover:text-ink-900"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <Button size="lg" className="flex-1" onClick={add} disabled={remaining <= 0}>
                    <ShoppingBag size={18} />
                    {remaining <= 0 && product.stock > 0 ? "Stock maximum dans le panier" : "Ajouter au panier"}
                  </Button>
                </div>
                {added && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-olive-50 px-4 py-3 text-sm text-olive-800">
                    <span className="flex items-center gap-2 font-semibold">
                      <Check size={16} /> Ajouté — {inCart?.quantite ?? 0} dans votre panier
                    </span>
                    <button type="button" onClick={() => router.push("/panier")} className="font-semibold underline underline-offset-4">
                      Voir le panier
                    </button>
                  </div>
                )}
              </div>
            )}

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              <li className="flex items-start gap-3 rounded-2xl bg-sand-100 p-4 text-sm">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ink-700" />
                <span><strong className="block text-ink-900">Paiement sécurisé</strong><span className="text-ink-600">Carte bancaire via Stripe</span></span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-sand-100 p-4 text-sm">
                <Truck size={18} className="mt-0.5 shrink-0 text-ink-700" />
                <span><strong className="block text-ink-900">Expédié par le vendeur</strong><span className="text-ink-600">Suivi à chaque étape</span></span>
              </li>
            </ul>
          </div>
        </div>

        <Reviews product={product} onAdded={() => dispatch(fetchProduct(id))} canReview={user?.role === "acheteur"} />
      </div>
    </SiteShell>
  );
}

function Reviews({ product, onAdded, canReview }: { product: Product; onAdded: () => void; canReview: boolean }) {
  const reviews = product.reviews || [];
  const [note, setNote] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const total = reviews.length;
  const moyenne = total ? reviews.reduce((s, r) => s + r.note, 0) / total : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post(`/products/${product.id}/reviews`, { note, commentaire });
      setCommentaire("");
      setMessage({ tone: "success", text: "Merci, votre avis est publié." });
      onAdded();
    } catch (err) {
      setMessage({ tone: "error", text: apiError(err, "Impossible de publier l’avis.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="avis" className="mt-24 scroll-mt-24 border-t border-sand-200 pt-16">
      <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="font-display text-3xl font-semibold text-ink-900">Avis clients</h2>
          {total > 0 ? (
            <div className="mt-6">
              <p className="font-display text-6xl font-semibold text-ink-900">{moyenne.toFixed(1).replace(".", ",")}</p>
              <Stars value={moyenne} size={18} className="mt-2" />
              <p className="mt-1 text-sm text-ink-500">Basé sur {total} avis vérifié{total > 1 ? "s" : ""}</p>
              <div className="mt-6 space-y-2">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = reviews.filter((r) => r.note === n).length;
                  return (
                    <div key={n} className="flex items-center gap-3 text-sm">
                      <span className="w-3 text-ink-600">{n}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200">
                        <div className="h-full rounded-full bg-saffron-400" style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                      <span className="w-5 text-right text-ink-500 tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">Aucun avis pour l’instant. Seuls les acheteurs de ce produit peuvent en laisser un.</p>
          )}

          {canReview && (
            <Card className="mt-8 p-5">
              <form onSubmit={submit}>
                <p className="font-semibold text-ink-900">Vous avez acheté ce produit ?</p>
                <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Note">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={note === n}
                      aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => setNote(n)}
                      className="p-0.5"
                    >
                      <Star size={26} fill="currentColor" strokeWidth={0} className={n <= (hover ?? note) ? "text-saffron-400" : "text-sand-300"} />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                  placeholder="Qualité, finitions, livraison…"
                  className="mt-3"
                  aria-label="Votre commentaire"
                />
                {message && <Alert tone={message.tone} className="mt-3">{message.text}</Alert>}
                <Button type="submit" className="mt-3 w-full" loading={loading}>
                  Publier mon avis
                </Button>
              </form>
            </Card>
          )}
        </div>

        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.user?.name || "Client"} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{r.user?.name || "Client"}</p>
                    <p className="text-xs text-olive-600">Achat vérifié</p>
                  </div>
                </div>
                <Stars value={r.note} />
              </div>
              {r.commentaire && <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{r.commentaire}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
