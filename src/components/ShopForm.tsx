"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Alert, Button, Field, Input, Textarea } from "./ui";

export interface ShopFormValues {
  nom: string;
  description: string;
  logo: File | null;
}

/** Formulaire boutique partagé : création et modification. */
export default function ShopForm({
  initial,
  currentLogo,
  submitLabel,
  loading,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: { nom: string; description: string | null };
  currentLogo?: string | null;
  submitLabel: string;
  loading: boolean;
  error?: string | null;
  onSubmit: (values: ShopFormValues) => void;
  onCancel?: () => void;
}) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogo(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const shown = preview || currentLogo;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ nom, description, logo });
      }}
      className="space-y-6"
    >
      <div className="flex items-center gap-5">
        <label className="group relative grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 transition hover:border-terra-400">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Logo de la boutique" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={26} className="text-ink-400 group-hover:text-terra-600" />
          )}
          <input type="file" accept="image/png, image/jpeg, image/webp" onChange={pick} className="sr-only" />
        </label>
        <div>
          <p className="text-sm font-semibold text-ink-800">Logo de la boutique</p>
          <p className="mt-1 text-xs text-ink-500">JPG, PNG ou WebP, 2 Mo maximum. Cliquez sur le cadre pour choisir.</p>
        </div>
      </div>

      <Field label="Nom de la boutique">
        <Input required maxLength={255} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Atelier du cuivre de Fès" />
      </Field>
      <Field label="Présentation" hint="Votre savoir-faire, vos matières, votre région : c’est ce que liront les acheteurs.">
        <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre atelier et vos produits…" />
      </Field>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={loading}>{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
