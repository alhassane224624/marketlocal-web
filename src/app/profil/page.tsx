"use client";

import { useEffect, useState } from "react";
import { Check, MapPin, Pencil, Plus, Star, Trash2, UserRound, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMe, type User } from "@/features/auth/authSlice";
import api from "@/lib/axios";
import { Alert, apiError, Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, LoadingRows, PageHeader } from "@/components/ui";

interface Address {
  id: number;
  libelle?: string | null;
  nom_destinataire: string;
  telephone: string;
  adresse: string;
  ville: string;
  est_par_defaut: boolean;
}

const roleLabel: Record<string, string> = { acheteur: "Acheteur", vendeur: "Vendeur", admin: "Administrateur" };

export default function ProfilPage() {
  const { user } = useAppSelector((s) => s.auth);
  return (
    <DashboardLayout>
      <PageHeader eyebrow="Mon compte" title="Profil & adresses" description="Vos informations personnelles et vos adresses de livraison." />
      {user && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          {/* key : le formulaire repart des données à jour après chaque enregistrement */}
          <ProfileForm key={`${user.id}-${user.name}-${user.telephone}`} user={user} />
          <Addresses user={user} />
        </div>
      )}
    </DashboardLayout>
  );
}

function ProfileForm({ user }: { user: User }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    name: user.name,
    telephone: user.telephone || "",
    adresse: user.adresse || "",
    ville: user.ville || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/me", form);
      await dispatch(fetchMe());
      setMessage({ tone: "success", text: "Profil mis à jour." });
    } catch (err) {
      setMessage({ tone: "error", text: apiError(err, "Impossible de mettre à jour le profil.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader title="Informations personnelles" icon={UserRound} />
      <div className="flex items-center gap-4 px-5 pt-5">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold text-ink-900">{user.name}</p>
          <p className="truncate text-sm text-ink-500">{user.email}</p>
          <Badge tone="terra" className="mt-1.5">{roleLabel[user.role]}</Badge>
        </div>
      </div>
      <form onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Nom complet" className="sm:col-span-2">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Téléphone">
          <Input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="06 00 00 00 00" />
        </Field>
        <Field label="Ville">
          <Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
        </Field>
        <Field label="Adresse" className="sm:col-span-2">
          <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
        </Field>
        {message && <Alert tone={message.tone} className="sm:col-span-2">{message.text}</Alert>}
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>Enregistrer</Button>
        </div>
      </form>
    </Card>
  );
}

function Addresses({ user }: { user: User }) {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/addresses")
      .then((r) => setAddresses(r.data.data || r.data || []))
      .catch(() => setAddresses([]));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: number) => {
    if (!confirm("Supprimer cette adresse ?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      await load(); // l'API peut avoir désigné une nouvelle adresse par défaut
    } catch (err) {
      setError(apiError(err, "Suppression impossible."));
    }
  };

  const makeDefault = async (id: number) => {
    try {
      await api.put(`/addresses/${id}/defaut`);
      setAddresses((old) => (old || []).map((x) => ({ ...x, est_par_defaut: x.id === id })));
    } catch (err) {
      setError(apiError(err, "Impossible de modifier l’adresse par défaut."));
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader
        title="Adresses de livraison"
        icon={MapPin}
        action={
          editing === null && (
            <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
              <Plus size={14} /> Ajouter
            </Button>
          )
        }
      />
      <div className="space-y-3 p-5">
        {error && <Alert>{error}</Alert>}
        {editing !== null && (
          <AddressForm
            key={editing === "new" ? "new" : editing.id}
            address={editing === "new" ? null : editing}
            user={user}
            isFirst={(addresses || []).length === 0}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
        {addresses === null ? (
          <LoadingRows rows={2} />
        ) : addresses.length === 0 && editing === null ? (
          <EmptyState icon={MapPin} title="Aucune adresse" description="Ajoutez une adresse pour commander plus vite." />
        ) : (
          addresses.map((a) => (
            <div key={a.id} className="rounded-xl border border-sand-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                    {a.libelle || "Adresse"}
                    {a.est_par_defaut && <Badge tone="olive"><Check size={11} /> Par défaut</Badge>}
                  </p>
                  <p className="mt-1 text-sm text-ink-600">{a.nom_destinataire} · {a.telephone}</p>
                  <p className="text-sm text-ink-600">{a.adresse}, {a.ville}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!a.est_par_defaut && (
                    <button type="button" onClick={() => makeDefault(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900" title="Définir par défaut" aria-label="Définir par défaut">
                      <Star size={15} />
                    </button>
                  )}
                  <button type="button" onClick={() => setEditing(a)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900" title="Modifier" aria-label="Modifier">
                    <Pencil size={15} />
                  </button>
                  <button type="button" onClick={() => remove(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-700" title="Supprimer" aria-label="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function AddressForm({
  address,
  user,
  isFirst,
  onCancel,
  onSaved,
}: {
  address: Address | null;
  user: User;
  isFirst: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    libelle: address?.libelle || "Domicile",
    nom_destinataire: address?.nom_destinataire || user.name,
    telephone: address?.telephone || user.telephone || "",
    adresse: address?.adresse || user.adresse || "",
    ville: address?.ville || user.ville || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (address) await api.put(`/addresses/${address.id}`, { ...form, est_par_defaut: address.est_par_defaut });
      else await api.post("/addresses", { ...form, est_par_defaut: isFirst });
      onSaved();
    } catch (err) {
      setError(apiError(err, "Impossible d’enregistrer l’adresse."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-4 rounded-xl border border-terra-200 bg-terra-50/40 p-4 sm:grid-cols-2">
      <div className="flex items-center justify-between sm:col-span-2">
        <p className="font-semibold text-ink-900">{address ? "Modifier l’adresse" : "Nouvelle adresse"}</p>
        <button type="button" onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-white" aria-label="Annuler">
          <X size={16} />
        </button>
      </div>
      <Field label="Libellé"><Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></Field>
      <Field label="Destinataire"><Input required value={form.nom_destinataire} onChange={(e) => setForm({ ...form, nom_destinataire: e.target.value })} /></Field>
      <Field label="Adresse" className="sm:col-span-2"><Input required value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></Field>
      <Field label="Ville"><Input required value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} /></Field>
      <Field label="Téléphone"><Input required type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></Field>
      {error && <Alert className="sm:col-span-2">{error}</Alert>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={saving}>Enregistrer</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}
