"use client";

import { useEffect, useState } from "react";
import { Check, FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { categoryStyle } from "@/components/MarketLocalUI";
import { Alert, apiError, Button, Card, cn, EmptyState, Input, LoadingRows, PageHeader } from "@/components/ui";

interface Category {
  id: number;
  nom: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/categories").then((r) => setCategories(r.data));

  useEffect(() => {
    load();
  }, []);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setError(apiError(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => api.post("/admin/categories", { nom: name }), "Création impossible.")) setName("");
  };

  const update = async (id: number) => {
    if (await run(() => api.put(`/admin/categories/${id}`, { nom: editName }), "Modification impossible.")) setEditing(null);
  };

  const remove = (category: Category) => {
    if (!confirm(`Supprimer la catégorie « ${category.nom} » ?`)) return;
    run(() => api.delete(`/admin/categories/${category.id}`), "Suppression impossible.");
  };

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Administration" title="Catégories" description="Les univers du catalogue. Une catégorie qui contient des produits ne peut pas être supprimée." />

      <Card className="mb-6 p-4">
        <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Nom de la nouvelle catégorie</span>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle catégorie, ex. Bijoux" />
          </label>
          <Button type="submit" loading={busy && editing === null} className="h-11">
            <Plus size={16} /> Ajouter
          </Button>
        </form>
      </Card>

      {error && <Alert className="mb-4">{error}</Alert>}

      {categories === null ? (
        <LoadingRows />
      ) : categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="Aucune catégorie" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const style = categoryStyle(c.nom);
            const Icon = style.icon;
            return (
              <Card key={c.id} className="flex items-center gap-3 p-4">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", style.bg, style.fg)}>
                  <Icon size={20} />
                </span>
                {editing === c.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      update(c.id);
                    }}
                    className="flex flex-1 items-center gap-1.5"
                  >
                    <Input autoFocus required value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" aria-label="Nom de la catégorie" />
                    <Button type="submit" size="sm" variant="dark" loading={busy} aria-label="Enregistrer"><Check size={14} /></Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)} aria-label="Annuler"><X size={14} /></Button>
                  </form>
                ) : (
                  <>
                    <p className="flex-1 font-semibold text-ink-900">{c.nom}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(c.id);
                        setEditName(c.nom);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-900"
                      aria-label={`Renommer ${c.nom}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => remove(c)} className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-700" aria-label={`Supprimer ${c.nom}`}>
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
