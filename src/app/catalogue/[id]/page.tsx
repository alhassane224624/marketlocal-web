"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Heart, Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProduct } from "@/features/products/productSlice";
import { addToCart } from "@/features/cart/cartSlice";
import api from "@/lib/axios";
import { money, ProductVisual, PublicHeader } from "@/components/MarketLocalUI";

// Note moyenne réelle, calculée à partir des avis renvoyés avec le produit.
function ratingLabel(reviews: { note: number }[]): string {
  if (reviews.length === 0) return "Aucun avis";
  const moyenne = reviews.reduce((s, r) => s + r.note, 0) / reviews.length;
  return `${moyenne.toFixed(1).replace(".", ",")} (${reviews.length} avis)`;
}

export default function ProductDetailPage() {
  const id = Number(useParams().id);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { current: product, status } = useAppSelector((s) => s.products);
  const cartItems = useAppSelector((s) => s.cart.items);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => { if (id) dispatch(fetchProduct(id)); }, [dispatch, id]);
  const inCart = cartItems.find((i) => i.product_id === id);

  if (status === "loading" || !product) return <div className="min-h-screen bg-[#f7faf8]"><PublicHeader /><div className="mx-auto max-w-[1100px] px-4 py-20"><div className="h-[480px] animate-pulse rounded-3xl bg-white" /></div></div>;

  const add = () => { for (let i = 0; i < quantity; i++) dispatch(addToCart({ product_id: product.id, nom: product.nom, prix: Number(product.prix), stock: product.stock, shop_nom: product.shop?.nom || "Vendeur local", image: product.image || undefined })); };

  return <div className="min-h-screen bg-[#f7faf8]"><PublicHeader /><main className="mx-auto max-w-[1180px] px-4 py-6 lg:px-6"><Link href="/catalogue" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-green-600"><ArrowLeft size={14} /> Retour au catalogue</Link><div className="grid overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_14px_50px_rgba(15,23,42,.06)] lg:grid-cols-[1.05fr_.95fr]"><div className="min-h-[430px] bg-slate-50 p-5 sm:p-8"><div className="relative h-full min-h-[390px] overflow-hidden rounded-3xl"><ProductVisual product={product} large /><button onClick={() => setFavorite(!favorite)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow-sm"> <Heart size={19} className={favorite ? "fill-red-500 text-red-500" : "text-slate-500"} /></button></div></div><div className="p-6 sm:p-9"><div className="mb-5 flex items-center justify-between gap-3"><span className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-green-700">{product.category?.nom || "Produit local"}</span><span className="flex items-center gap-1 text-xs font-bold text-amber-500"><Star size={14} fill="currentColor" /> {ratingLabel(product.reviews || [])}</span></div><h1 className="text-3xl font-black tracking-tight text-slate-900">{product.nom}</h1><Link href="/catalogue" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-green-600"><span className="grid h-6 w-6 place-items-center rounded-full bg-orange-50 text-orange-600"><StoreIcon /></span>{product.shop?.nom || "Vendeur local"}<CheckCircle2 size={13} className="text-green-500" /></Link><p className="mt-6 text-3xl font-black text-slate-900">{money(product.prix)}</p><p className={`mt-2 text-xs font-bold ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>{product.stock > 0 ? `${product.stock} exemplaires disponibles` : "Rupture de stock"}</p><p className="mt-5 text-sm leading-6 text-slate-500">{product.description || "Un produit sélectionné auprès d'un vendeur local. Découvrez son savoir-faire et commandez en toute confiance."}</p><div className="my-6 grid grid-cols-3 gap-2"><MiniFeature icon={<ShieldCheck size={16} />} text="Paiement sécurisé" /><MiniFeature icon={<Truck size={16} />} text="Livraison suivie" /><MiniFeature icon={<CheckCircle2 size={16} />} text="Vendeur vérifié" /></div><div className="flex flex-col gap-2 sm:flex-row"><div className="flex h-12 items-center justify-between rounded-xl border border-slate-200 px-2 sm:w-32"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-50"><Minus size={14} /></button><span className="text-sm font-bold">{quantity}</span><button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-50"><Plus size={14} /></button></div><button onClick={add} disabled={product.stock <= 0} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-xs font-extrabold text-white shadow-sm hover:bg-green-700 disabled:bg-slate-200">Ajouter au panier {inCart && `(${inCart.quantite})`}</button></div><button onClick={() => { add(); router.push("/panier"); }} disabled={product.stock <= 0} className="mt-2 h-12 w-full rounded-xl border border-green-200 text-xs font-extrabold text-green-700 hover:bg-green-50 disabled:text-slate-400">Acheter maintenant</button><Reviews productId={product.id} reviews={product.reviews || []} onAdded={() => dispatch(fetchProduct(id))} /></div></div></main></div>;
}

function MiniFeature({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="rounded-xl bg-slate-50 p-3 text-center text-[10px] font-bold text-slate-500"><div className="mb-1 flex justify-center text-green-600">{icon}</div>{text}</div>; }
function StoreIcon() { return <span className="text-[10px]">ML</span>; }

function Reviews({ productId, reviews, onAdded }: { productId: number; reviews: { id: number; note: number; commentaire: string | null; user?: { name: string } }[]; onAdded: () => void }) {
  const { user } = useAppSelector((s) => s.auth); const [note, setNote] = useState(5); const [commentaire, setCommentaire] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setMessage(""); try { await api.post(`/products/${productId}/reviews`, { note, commentaire }); setCommentaire(""); setMessage("Merci pour votre avis !"); onAdded(); } catch (err: any) { setMessage(err.response?.data?.message || "Impossible de publier l'avis."); } finally { setLoading(false); } };
  return <section className="mt-8 border-t border-slate-100 pt-7"><div className="flex items-center justify-between"><h2 className="text-base font-extrabold text-slate-900">Avis clients <span className="text-slate-400">({reviews.length})</span></h2><span className="text-xs text-amber-500">★★★★★</span></div><div className="mt-4 space-y-2">{reviews.slice(0, 4).map((r) => <div key={r.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between"><span className="text-xs font-bold text-slate-700">{r.user?.name || "Client"}</span><span className="text-[11px] text-amber-500">{"★".repeat(r.note)}{"☆".repeat(5-r.note)}</span></div>{r.commentaire && <p className="mt-1 text-xs text-slate-500">{r.commentaire}</p>}</div>)}</div>{user?.role === "acheteur" && <form onSubmit={submit} className="mt-4 rounded-2xl border border-slate-100 p-4"><p className="text-xs font-bold text-slate-700">Votre expérience</p><div className="mt-2 flex gap-1">{[1,2,3,4,5].map((n) => <button type="button" key={n} onClick={() => setNote(n)} className={n <= note ? "text-amber-400" : "text-slate-200"}><Star size={20} fill="currentColor" /></button>)}</div><textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} placeholder="Partagez votre avis..." className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-green-300" />{message && <p className={`mt-2 text-xs ${message.includes("Merci") ? "text-green-600" : "text-red-500"}`}>{message}</p>}<button disabled={loading} className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">{loading ? "Publication..." : "Publier l'avis"}</button></form>}</section>;
}
