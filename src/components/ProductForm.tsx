"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCategories } from "@/features/categories/categorySlice";
import { ProductVisual } from "./MarketLocalUI";
import { Alert, Button, buttonClass, Card, Field, Input, money, Select, Textarea } from "./ui";

export interface ProductFormValues {
  nom: string;
  description: string;
  prix: string;
  stock: string;
  category_id: string;
  image: File | null;
}

/** Formulaire produit partagé (ajout et modification), avec aperçu de la carte catalogue. */
export default function ProductForm({
  initial,
  currentImage,
  submitLabel,
  loading,
  error,
  onSubmit,
}: {
  initial?: Omit<ProductFormValues, "image">;
  currentImage?: string | null;
  submitLabel: string;
  loading: boolean;
  error: string | null;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const dispatch = useAppDispatch();
  const { items: categories } = useAppSelector((state) => state.categories);
  const [values, setValues] = useState<Omit<ProductFormValues, "image">>(
    initial || { nom: "", description: "", prix: "", stock: "", category_id: "" },
  );
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues({ ...values, [key]: e.target.value });

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const category = categories.find((c) => String(c.id) === values.category_id);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...values, image });
      }}
      className="grid gap-6 lg:grid-cols-[1fr_300px]"
    >
      <Card className="space-y-6 p-6 sm:p-8">
        <label className="group flex cursor-pointer items-center gap-5 rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 p-4 transition hover:border-terra-400">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white text-ink-400 shadow-soft group-hover:text-terra-600">
            <ImagePlus size={24} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink-800">{image ? image.name : "Ajouter une photo"}</span>
            <span className="mt-0.5 block text-xs text-ink-500">JPG, PNG ou WebP, 2 Mo maximum. Sans photo, une illustration de la catégorie est affichée.</span>
          </span>
          <input type="file" accept="image/png, image/jpeg, image/webp" onChange={pick} className="sr-only" />
        </label>

        <Field label="Nom du produit">
          <Input required maxLength={255} value={values.nom} onChange={set("nom")} placeholder="Ex. Tapis berbère Beni Ouarain" />
        </Field>
        <Field label="Description" hint="Matières, dimensions, fabrication, entretien…">
          <Textarea rows={5} value={values.description} onChange={set("description")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Prix (MAD)">
            <Input required type="number" min="0" step="0.01" value={values.prix} onChange={set("prix")} />
          </Field>
          <Field label="Stock">
            <Input required type="number" min="0" step="1" value={values.stock} onChange={set("stock")} />
          </Field>
          <Field label="Catégorie">
            <Select required value={values.category_id} onChange={set("category_id")}>
              <option value="">Choisir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="flex flex-wrap gap-2 border-t border-sand-100 pt-6">
          <Button type="submit" loading={loading}>{submitLabel}</Button>
          <Link href="/mes-produits" className={buttonClass("ghost")}>Annuler</Link>
        </div>
      </Card>

      <aside className="lg:sticky lg:top-10 lg:self-start">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Aperçu dans le catalogue</p>
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft">
          <div className="aspect-[4/3]">
            <ProductVisual product={{ image: preview || currentImage, nom: values.nom || "Produit", category: category || null }} />
          </div>
          <div className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">{category?.nom || "Catégorie"}</p>
            <p className="mt-1.5 line-clamp-2 font-display text-[1.05rem] font-semibold text-ink-900">{values.nom || "Nom du produit"}</p>
            <p className="mt-3 text-lg font-bold tabular-nums">{money(values.prix || 0)}</p>
          </div>
        </div>
      </aside>
    </form>
  );
}

/** FormData attendu par l'API Laravel. */
export function productFormData(values: ProductFormValues, method?: "PUT"): FormData {
  const formData = new FormData();
  formData.append("nom", values.nom);
  formData.append("description", values.description);
  formData.append("prix", values.prix);
  formData.append("stock", values.stock);
  formData.append("category_id", values.category_id);
  if (values.image) formData.append("image", values.image);
  if (method) formData.append("_method", method); // Laravel ne lit pas le multipart en PUT
  return formData;
}
