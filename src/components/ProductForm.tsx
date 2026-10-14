"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCategories } from "@/features/categories/categorySlice";
import type { ProductImage } from "@/features/products/productSlice";
import { ProductVisual } from "./MarketLocalUI";
import { CategoryPicker, ImagesPicker } from "./ProductFormFields";
import { Alert, Button, buttonClass, Card, Field, Input, money, Textarea } from "./ui";

export interface ProductFormFields {
  nom: string;
  description: string;
  prix: string;
  stock: string;
  category_ids: number[];
}

export interface ProductFormValues extends ProductFormFields {
  /** Nouvelles images à envoyer (ajoutées après les existantes). */
  files: File[];
  /** Images existantes à supprimer (modification). */
  remove_image_ids: number[];
  /** Image existante à mettre en couverture (modification). */
  cover_image_id: number | null;
}

/** Formulaire produit partagé (ajout et modification), avec aperçu de la carte catalogue. */
export default function ProductForm({
  initial,
  existingImages = [],
  submitLabel,
  loading,
  error,
  onSubmit,
}: {
  initial?: ProductFormFields;
  existingImages?: ProductImage[];
  submitLabel: string;
  loading: boolean;
  error: string | null;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const dispatch = useAppDispatch();
  const { items: categories } = useAppSelector((state) => state.categories);
  const [values, setValues] = useState<ProductFormFields>(
    initial || { nom: "", description: "", prix: "", stock: "", category_ids: [] },
  );
  const [files, setFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [coverId, setCoverId] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const set = (key: "nom" | "description" | "prix" | "stock") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues({ ...values, [key]: e.target.value });

  // Aperçu : couverture choisie, sinon 1re image conservée, sinon 1re nouvelle image.
  const kept = existingImages.filter((img) => !removedIds.includes(img.id));
  const firstFilePreview = useMemo(() => (files[0] ? URL.createObjectURL(files[0]) : null), [files]);
  useEffect(() => () => { if (firstFilePreview) URL.revokeObjectURL(firstFilePreview); }, [firstFilePreview]);
  const coverUrl = (kept.find((img) => img.id === coverId) || kept[0])?.url || firstFilePreview;
  const mainCategory = categories.find((c) => c.id === values.category_ids[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (values.category_ids.length === 0) {
          setLocalError("Choisissez au moins une catégorie.");
          return;
        }
        setLocalError(null);
        onSubmit({ ...values, files, remove_image_ids: removedIds, cover_image_id: coverId });
      }}
      className="grid gap-6 lg:grid-cols-[1fr_300px]"
    >
      <Card className="space-y-6 p-6 sm:p-8">
        <ImagesPicker
          existing={existingImages}
          removedIds={removedIds}
          onRemovedChange={setRemovedIds}
          coverId={coverId}
          onCoverChange={setCoverId}
          files={files}
          onFilesChange={setFiles}
        />

        <Field label="Nom du produit">
          <Input required maxLength={255} value={values.nom} onChange={set("nom")} placeholder="Ex. Tapis berbère Beni Ouarain" />
        </Field>
        <Field label="Description" hint="Matières, dimensions, fabrication, entretien…">
          <Textarea rows={5} value={values.description} onChange={set("description")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Prix (MAD)">
            <Input required type="number" min="0" step="0.01" value={values.prix} onChange={set("prix")} />
          </Field>
          <Field label="Stock">
            <Input required type="number" min="0" step="1" value={values.stock} onChange={set("stock")} />
          </Field>
        </div>

        <CategoryPicker categories={categories} value={values.category_ids} onChange={(ids) => setValues({ ...values, category_ids: ids })} />

        {(localError || error) && <Alert>{localError || error}</Alert>}

        <div className="flex flex-wrap gap-2 border-t border-sand-100 pt-6">
          <Button type="submit" loading={loading}>{submitLabel}</Button>
          <Link href="/mes-produits" className={buttonClass("ghost")}>Annuler</Link>
        </div>
      </Card>

      <aside className="lg:sticky lg:top-10 lg:self-start">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Aperçu dans le catalogue</p>
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft">
          <div className="aspect-[4/3]">
            <ProductVisual product={{ image: coverUrl, nom: values.nom || "Produit", category: mainCategory || null }} />
          </div>
          <div className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">{mainCategory?.nom || "Catégorie"}</p>
            <p className="mt-1.5 line-clamp-2 font-display text-[1.05rem] font-semibold text-ink-900">{values.nom || "Nom du produit"}</p>
            <p className="mt-3 text-lg font-bold tabular-nums">{money(values.prix || 0)}</p>
          </div>
        </div>
      </aside>
    </form>
  );
}

/** FormData attendu par l'API Laravel (category_ids[], images[], remove_image_ids[], cover_image_id). */
export function productFormData(values: ProductFormValues, method?: "PUT"): FormData {
  const formData = new FormData();
  formData.append("nom", values.nom);
  formData.append("description", values.description);
  formData.append("prix", values.prix);
  formData.append("stock", values.stock);
  values.category_ids.forEach((id) => formData.append("category_ids[]", String(id)));
  values.files.forEach((file) => formData.append("images[]", file));
  values.remove_image_ids.forEach((id) => formData.append("remove_image_ids[]", String(id)));
  if (values.cover_image_id) formData.append("cover_image_id", String(values.cover_image_id));
  if (method) formData.append("_method", method); // Laravel ne lit pas le multipart en PUT
  return formData;
}
