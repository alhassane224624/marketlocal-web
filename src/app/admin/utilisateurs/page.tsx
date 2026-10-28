"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Pencil, RotateCcw, UserPlus, Users, X } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { useConfirm, usePrompt } from "@/components/ConfirmDialog";
import { Alert, apiError, Avatar, Badge, Button, Card, EmptyState, Field, formatDate, Input, LoadingRows, PageHeader, Pagination, SearchInput, Segmented, Select } from "@/components/ui";

interface UserAdmin {
  id: number;
  name: string;
  email: string;
  role: "acheteur" | "vendeur" | "admin" | "livreur";
  telephone?: string | null;
  ville?: string | null;
  created_at: string;
  suspendu_at?: string | null;
  motif_suspension?: string | null;
  shop?: { id: number; nom: string; statut: string } | null;
  commandes_count?: number;
}

const shopStatus: Record<string, { label: string; tone: "olive" | "saffron" | "red" }> = {
  valide: { label: "validée", tone: "olive" },
  en_attente: { label: "en attente", tone: "saffron" },
  refuse: { label: "refusée", tone: "red" },
};

const emptyForm = { name: "", email: "", password: "", role: "acheteur", telephone: "", ville: "" };

const roleBadge = {
  acheteur: { label: "Acheteur", tone: "saffron" as const },
  vendeur: { label: "Vendeur", tone: "terra" as const },
  admin: { label: "Admin", tone: "olive" as const },
  livreur: { label: "Livreur", tone: "sky" as const },
};

interface UsersPage {
  key: string;
  users: UserAdmin[];
  meta: { page: number; last_page: number; total: number };
  counts: Record<string, number>;
}

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");
  // Recherche envoyée à l'API (après 300 ms sans frappe).
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  // Résultat rattaché à la requête qui l'a produit : tant qu'il ne correspond pas, on affiche le chargement.
  const [result, setResult] = useState<UsersPage | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [ask, promptDialog] = usePrompt();
  const [confirm, confirmDialog] = useConfirm();
  const [showForm, setShowForm] = useState(false);
  // null : création ; sinon, compte en cours de modification.
  const [editing, setEditing] = useState<UserAdmin | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const setField = (key: keyof typeof emptyForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const openForm = (user: UserAdmin | null) => {
    setEditing(user);
    setForm(
      user
        ? { name: user.name, email: user.email, password: "", role: user.role, telephone: user.telephone || "", ville: user.ville || "" }
        : emptyForm,
    );
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const r = await api.put(`/admin/users/${editing.id}`, form);
        replace(r.data);
      } else {
        await api.post("/admin/users", form);
        // Nouveau compte : on recharge la liste (tri, filtres et compteurs viennent de l'API).
        setReloadKey((k) => k + 1);
      }
      closeForm();
    } catch (err) {
      setFormError(apiError(err, editing ? "Impossible de modifier ce compte." : "Impossible de créer ce compte."));
    } finally {
      setSaving(false);
    }
  };

  const replace = (user: UserAdmin) =>
    setResult((prev) => prev && { ...prev, users: prev.users.map((u) => (u.id === user.id ? { ...u, ...user } : u)) });

  const suspend = async (user: UserAdmin) => {
    const motif = await ask({
      title: `Suspendre ${user.name} ?`,
      description:
        user.role === "vendeur"
          ? "Le compte ne pourra plus se connecter et ses produits disparaîtront du catalogue. Vous pourrez le réactiver à tout moment."
          : "Le compte ne pourra plus se connecter. Vous pourrez le réactiver à tout moment.",
      inputLabel: "Motif (affiché à l’utilisateur s’il tente de se connecter)",
      placeholder: "Ex. : signalements répétés de produits non conformes",
      minLength: 5,
      confirmLabel: "Suspendre le compte",
      tone: "danger",
    });
    if (motif === null) return;
    setBusyId(user.id);
    setError("");
    try {
      const r = await api.post(`/admin/users/${user.id}/suspendre`, { motif });
      replace(r.data);
    } catch (err) {
      setError(apiError(err, "Impossible de suspendre ce compte."));
    } finally {
      setBusyId(null);
    }
  };

  const reactivate = async (user: UserAdmin) => {
    const ok = await confirm({
      title: `Réactiver ${user.name} ?`,
      description: user.role === "vendeur" ? "Le compte pourra de nouveau se connecter et ses produits réapparaîtront dans le catalogue." : "Le compte pourra de nouveau se connecter.",
      confirmLabel: "Réactiver",
    });
    if (!ok) return;
    setBusyId(user.id);
    setError("");
    try {
      const r = await api.post(`/admin/users/${user.id}/reactiver`);
      replace(r.data);
    } catch (err) {
      setError(apiError(err, "Impossible de réactiver ce compte."));
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const requestKey = `${filter}|${search}|${page}|${reloadKey}`;

  useEffect(() => {
    api
      .get("/admin/users", { params: { role: filter ?? undefined, q: search || undefined, page } })
      .then((r) => setResult({ key: requestKey, users: r.data.data, meta: r.data.meta, counts: r.data.counts }))
      .catch((err) => {
        setError(apiError(err, "Impossible de charger les utilisateurs."));
        setResult((prev) => (prev ? { ...prev, key: requestKey } : { key: requestKey, users: [], meta: { page: 1, last_page: 1, total: 0 }, counts: {} }));
      });
    // requestKey résume filter, search, page et reloadKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const loading = result?.key !== requestKey;
  const users = result?.users ?? [];
  const meta = result?.meta;
  const count = (key: string) => result?.counts[key] ?? 0;

  const changeFilter = (value: string | null) => {
    setFilter(value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      {promptDialog}
      {confirmDialog}
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Les comptes acheteurs, vendeurs, livreurs et administrateurs."
        actions={
          <Button onClick={() => (showForm ? closeForm() : openForm(null))} variant={showForm ? "outline" : "primary"}>
            {showForm ? <><X size={15} /> Fermer</> : <><UserPlus size={15} /> Nouvel utilisateur</>}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 font-semibold text-ink-900">{editing ? `Modifier ${editing.name}` : "Nouvel utilisateur"}</h2>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet">
              <Input required value={form.name} onChange={setField("name")} />
            </Field>
            <Field label="E-mail">
              <Input required type="email" value={form.email} onChange={setField("email")} />
            </Field>
            <Field
              label={editing ? "Nouveau mot de passe" : "Mot de passe"}
              hint={editing ? "Laisser vide pour ne pas le changer. Sinon, l’utilisateur sera déconnecté." : "8 caractères minimum, à communiquer à l’utilisateur."}
            >
              <Input required={!editing} type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={setField("password")} />
            </Field>
            <Field label="Rôle">
              <Select value={form.role} onChange={setField("role")}>
                <option value="acheteur">Acheteur</option>
                <option value="vendeur">Vendeur</option>
                <option value="livreur">Livreur</option>
                <option value="admin">Administrateur</option>
              </Select>
            </Field>
            <Field label={form.role === "livreur" ? "Téléphone (obligatoire)" : "Téléphone"}>
              <Input required={form.role === "livreur"} value={form.telephone} onChange={setField("telephone")} />
            </Field>
            <Field label="Ville">
              <Input value={form.ville} onChange={setField("ville")} />
            </Field>
            {formError && <Alert className="sm:col-span-2">{formError}</Alert>}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={saving}>
                {editing ? <><Pencil size={15} /> Enregistrer</> : <><UserPlus size={15} /> Créer le compte</>}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Segmented
          options={[
            { value: null, label: "Tous", count: count("tous") },
            { value: "acheteur", label: "Acheteurs", count: count("acheteur") },
            { value: "vendeur", label: "Vendeurs", count: count("vendeur") },
            { value: "livreur", label: "Livreurs", count: count("livreur") },
            { value: "admin", label: "Admins", count: count("admin") },
            ...(count("suspendu") > 0 ? [{ value: "suspendu", label: "Suspendus", count: count("suspendu") }] : []),
          ]}
          value={filter}
          onChange={changeFilter}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Nom, e-mail, ville, boutique…" />
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingRows rows={4} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun compte ne correspond à cette recherche." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-sand-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3 font-semibold">Utilisateur</th>
                  <th className="px-5 py-3 font-semibold">Rôle</th>
                  <th className="px-5 py-3 font-semibold">Activité</th>
                  <th className="px-5 py-3 font-semibold">Ville</th>
                  <th className="px-5 py-3 font-semibold">Inscrit le</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {users.map((u) => (
                  <tr key={u.id} className={`transition hover:bg-sand-50 ${u.suspendu_at ? "bg-red-50/40" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{u.name}</p>
                          <p className="truncate text-xs text-ink-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge tone={roleBadge[u.role].tone}>{roleBadge[u.role].label}</Badge></td>
                    <td className="px-5 py-3 text-ink-600">
                      {u.role === "vendeur" ? (
                        u.shop ? (
                          <Link href="/admin/commissions" className="hover:text-terra-700">
                            <span className="font-semibold text-ink-800">{u.shop.nom}</span>{" "}
                            <Badge tone={shopStatus[u.shop.statut]?.tone ?? "ink"}>{shopStatus[u.shop.statut]?.label ?? u.shop.statut}</Badge>
                          </Link>
                        ) : (
                          <span className="text-ink-400">Pas de boutique</span>
                        )
                      ) : u.role === "acheteur" ? (
                        `${u.commandes_count ?? 0} commande${(u.commandes_count ?? 0) > 1 ? "s" : ""}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-600">{u.ville || "—"}</td>
                    <td className="px-5 py-3 text-ink-600">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      {u.suspendu_at ? (
                        <div title={u.motif_suspension || undefined}>
                          <Badge tone="red">Suspendu</Badge>
                          {u.motif_suspension && <p className="mt-1 max-w-[180px] truncate text-xs text-red-700">{u.motif_suspension}</p>}
                        </div>
                      ) : (
                        <Badge tone="olive">Actif</Badge>
                      )}
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-5 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openForm(u)}>
                        <Pencil size={13} /> Modifier
                      </Button>
                      {u.role !== "admin" &&
                        (u.suspendu_at ? (
                          <Button size="sm" variant="outline" onClick={() => reactivate(u)} loading={busyId === u.id}>
                            <RotateCcw size={13} /> Réactiver
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => suspend(u)} loading={busyId === u.id}>
                            <Ban size={13} /> Suspendre
                          </Button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {meta && meta.last_page > 1 && (
        <Pagination page={meta.page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}
    </DashboardLayout>
  );
}
