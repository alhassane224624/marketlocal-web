"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMyShop } from "@/features/shop/shopSlice";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Store, Pencil, Package, Star, CreditCard, ShieldCheck, ExternalLink } from "lucide-react";

export default function MaBoutiquePage() {
  const dispatch = useAppDispatch();
  const { shop } = useAppSelector((state) => state.shop);
  const [editing, setEditing] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");

  useEffect(() => { dispatch(fetchMyShop()); }, [dispatch]);
  useEffect(() => { if (shop) { setNom(shop.nom); setDescription(shop.description || ""); } }, [shop]);

  if (!shop) return <DashboardLayout><p className="text-slate-500">Chargement de votre boutique...</p></DashboardLayout>;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogo(file); setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const formData = new FormData(); formData.append("nom", nom); formData.append("description", description);
      if (logo) formData.append("logo", logo); formData.append("_method", "PUT");
      await api.post("/shops/mine", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await dispatch(fetchMyShop()); setEditing(false); setLogo(null); setPreview(null);
    } catch (e: any) { alert(e.response?.data?.message || "Impossible de modifier la boutique."); }
    finally { setSaving(false); }
  };

  const startStripe = async () => {
    setStripeLoading(true); setStripeMessage("");
    try {
      const { data } = await api.post("/shop/stripe/onboard", {
        refresh_url: `${window.location.origin}/ma-boutique?stripe=refresh`,
        return_url: `${window.location.origin}/ma-boutique?stripe=return`,
      });
      window.location.href = data.url;
    } catch (e: any) {
      setStripeMessage(e.response?.data?.message || "Impossible de démarrer Stripe.");
    } finally { setStripeLoading(false); }
  };

  const refreshStripe = async () => {
    setStripeLoading(true); setStripeMessage("");
    try { await api.get("/shop/stripe/status"); await api.post("/shop/stripe/settle-pending"); await dispatch(fetchMyShop()); setStripeMessage("Statut Stripe actualisé et transferts en attente vérifiés."); }
    catch (e: any) { setStripeMessage(e.response?.data?.message || "Impossible de vérifier Stripe."); }
    finally { setStripeLoading(false); }
  };

  const badge = {
    en_attente: { label: "En attente", color: "bg-amber-50 text-amber-700" },
    valide: { label: "Boutique validée", color: "bg-green-50 text-green-700" },
    refuse: { label: "Refusée", color: "bg-red-50 text-red-700" },
  }[shop.statut];

  return (
    <DashboardLayout>
      <div className="mb-6"><h1 className="text-2xl font-black text-slate-900">Ma boutique</h1><p className="mt-1 text-sm text-slate-500">Gérez votre boutique et votre compte vendeur.</p></div>

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-green-50 grid place-items-center">
              {(preview || shop.logo) ? <img src={preview || shop.logo || ""} alt="Logo" className="h-full w-full object-cover" /> : <Store className="text-green-500" size={28} />}
            </div>
            <div><p className="text-lg font-black text-slate-900">{shop.nom}</p><span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${badge.color}`}>{badge.label}</span></div>
          </div>
          <button onClick={() => setEditing(!editing)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Pencil size={14}/>{editing ? "Annuler" : "Modifier"}</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><StatMini icon={<Package size={16}/>} label="Produits" value={String(shop.products?.length ?? 0)}/><StatMini icon={<Star size={16}/>} label="Note moyenne" value="—"/></div>
      </div>

      {shop.statut === "valide" && <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><div className="flex items-center gap-2"><CreditCard size={18} className="text-green-600"/><h2 className="text-sm font-black text-slate-900">Paiements vendeur</h2></div><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">Connectez votre compte Stripe Express pour recevoir votre part des ventes. Vos informations bancaires restent chez Stripe.</p></div>
          <div className="shrink-0 text-right"><p className={`text-xs font-black ${shop.is_active ? "text-green-600" : "text-amber-600"}`}>{shop.is_active ? "Compte activé" : shop.stripe_account_id ? "Onboarding à terminer" : "Non connecté"}</p><p className="mt-1 text-[10px] text-slate-400">KYC : {shop.kyc_status || "non démarré"}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!shop.is_active && <button onClick={startStripe} disabled={stripeLoading} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"><ExternalLink size={14}/>{stripeLoading ? "Ouverture..." : shop.stripe_account_id ? "Continuer Stripe" : "Configurer Stripe"}</button>}
          {shop.stripe_account_id && <button onClick={refreshStripe} disabled={stripeLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50"><ShieldCheck size={14}/>Actualiser le statut</button>}
        </div>
        {stripeMessage && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{stripeMessage}</p>}
      </section>}

      {editing && <form onSubmit={handleSave} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-black text-slate-900">Informations de la boutique</h3>
        <div><label className="mb-1 block text-xs font-bold text-slate-600">Logo</label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="text-xs text-slate-500"/></div>
        <div><label className="mb-1 block text-xs font-bold text-slate-600">Nom</label><input value={nom} onChange={e=>setNom(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
        <div><label className="mb-1 block text-xs font-bold text-slate-600">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
        <button disabled={saving} className="rounded-xl bg-green-600 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{saving ? "Enregistrement..." : "Enregistrer"}</button>
      </form>}
    </DashboardLayout>
  );
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"><div className="text-green-600">{icon}</div><div><p className="text-[10px] text-slate-400">{label}</p><p className="text-sm font-black text-slate-800">{value}</p></div></div>;
}
