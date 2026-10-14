"use client";

import { useEffect, useMemo } from "react";
import { Check, ImagePlus, Star, Trash2, Undo2 } from "lucide-react";
import type { ProductImage } from "@/features/products/productSlice";
import { cn } from "./ui";

// Mêmes limites que l'API (Product::MAX_IMAGES / MAX_CATEGORIES).
export const MAX_IMAGES = 8;
export const MAX_CATEGORIES = 5;

const labelClass = "text-[13px] font-semibold text-ink-700";
const counterClass = "text-xs tabular-nums text-ink-500";
const badgeClass = "absolute left-1.5 top-1.5 rounded-md bg-terra-600 px-1.5 py-0.5 text-[10px] font-bold text-white";
const iconButtonClass = "grid h-7 w-7 place-items-center rounded-lg bg-white/95 shadow-sm transition hover:bg-white";

/**
 * Sélection de plusieurs catégories. L'ordre de sélection compte :
 * la première catégorie choisie devient la catégorie principale.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: { id: number; nom: string }[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const toggle = (id: number) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < MAX_CATEGORIES) onChange([...value, id]);
  };

  return (
    <fieldset>
      <div className="mb-1.5 flex items-center justify-between">
        <legend className={labelClass}>Catégories</legend>
        <span className={counterClass}>{value.length}/{MAX_CATEGORIES}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const index = value.indexOf(cat.id);
          const selected = index !== -1;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(cat.id)}
              disabled={!selected && value.length >= MAX_CATEGORIES}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition disabled:opacity-40",
                selected ? "border-ink-900 bg-ink-900 text-sand-50" : "border-sand-300 bg-white text-ink-700 hover:border-ink-300",
              )}
            >
              {selected && <Check size={13} strokeWidth={3} />}
              {cat.nom}
              {index === 0 && <span className="rounded-full bg-terra-500 px-1.5 text-[10px] text-white">principale</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-ink-500">La première catégorie choisie est la catégorie principale.</p>
    </fieldset>
  );
}

/**
 * Galerie d'images : images déjà enregistrées (suppression, choix de la couverture)
 * + nouvelles images à envoyer. La couverture est la 1re image affichée dans le catalogue.
 */
export function ImagesPicker({
  existing = [],
  removedIds = [],
  onRemovedChange,
  coverId = null,
  onCoverChange,
  files,
  onFilesChange,
}: {
  existing?: ProductImage[];
  removedIds?: number[];
  onRemovedChange?: (ids: number[]) => void;
  coverId?: number | null;
  onCoverChange?: (id: number) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const kept = existing.filter((img) => !removedIds.includes(img.id));
  const remaining = MAX_IMAGES - kept.length - files.length;
  const effectiveCover = coverId && kept.some((i) => i.id === coverId) ? coverId : kept[0]?.id;

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).slice(0, Math.max(0, remaining));
    onFilesChange([...files, ...picked]);
    e.target.value = "";
  };

  const toggleRemoved = (id: number) => {
    if (removedIds.includes(id)) {
      // Annuler la suppression seulement s'il reste de la place.
      if (remaining > 0) onRemovedChange?.(removedIds.filter((r) => r !== id));
    } else {
      onRemovedChange?.([...removedIds, id]);
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={labelClass}>Photos du produit</span>
        <span className={counterClass}>{kept.length + files.length}/{MAX_IMAGES}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {existing.map((img) => {
          const removed = removedIds.includes(img.id);
          const isCover = !removed && img.id === effectiveCover;
          return (
            <div key={img.id} className={cn("relative aspect-square overflow-hidden rounded-xl border", isCover ? "border-terra-500 ring-2 ring-terra-100" : "border-sand-200")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className={cn("h-full w-full object-cover", removed && "opacity-30 grayscale")} />
              {isCover && <span className={badgeClass}>Couverture</span>}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                {!removed && !isCover && onCoverChange && (
                  <button type="button" title="Utiliser comme couverture" aria-label="Utiliser comme couverture" onClick={() => onCoverChange(img.id)} className={cn(iconButtonClass, "text-saffron-700")}>
                    <Star size={14} />
                  </button>
                )}
                <button
                  type="button"
                  title={removed ? (remaining > 0 ? "Annuler la suppression" : "Limite d’images atteinte") : "Supprimer"}
                  aria-label={removed ? "Annuler la suppression" : "Supprimer l’image"}
                  onClick={() => toggleRemoved(img.id)}
                  className={cn(iconButtonClass, "text-red-700")}
                >
                  {removed ? <Undo2 size={14} /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          );
        })}
        {previews.map((url, i) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-terra-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {kept.length === 0 && i === 0 && <span className={badgeClass}>Couverture</span>}
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-terra-700">Nouvelle</span>
            <button type="button" title="Retirer" aria-label="Retirer l’image" onClick={() => onFilesChange(files.filter((_, j) => j !== i))} className={cn(iconButtonClass, "absolute bottom-1.5 right-1.5 text-red-700")}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand-300 bg-sand-50 text-ink-500 transition hover:border-terra-400 hover:text-terra-600">
            <ImagePlus size={22} />
            <span className="text-xs font-semibold">Ajouter</span>
            <input type="file" multiple accept="image/png, image/jpeg, image/webp" onChange={addFiles} className="sr-only" />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-500">JPG, PNG ou WebP, 2 Mo max par image. Sans photo, une illustration de la catégorie est affichée.</p>
    </div>
  );
}
