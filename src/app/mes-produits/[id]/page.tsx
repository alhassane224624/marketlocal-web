"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PackageX } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import ProductForm, { productFormData, type ProductFormValues } from "@/components/ProductForm";
import { apiError, ButtonLink, EmptyState, LoadingRows, PageHeader } from "@/components/ui";

export default function ModifierProduitPage() {
  const id = String(useParams().id);
  const router = useRouter();
  const [initial, setInitial] = useState<Omit<ProductFormValues, "image"> | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data: p }) => {
        setInitial({
          nom: p.nom,
          description: p.description || "",
          prix: String(p.prix),
          stock: String(p.stock),
          category_id: String(p.category?.id ?? p.category_id ?? ""),
        });
        setCurrentImage(p.image);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Produits" title="Modifier le produit" description={initial?.nom} />
      {notFound ? (
        <EmptyState icon={PackageX} title="Produit introuvable" action={<ButtonLink href="/mes-produits">Retour aux produits</ButtonLink>} />
      ) : !initial ? (
        <LoadingRows rows={4} />
      ) : (
        <ProductForm
          initial={initial}
          currentImage={currentImage}
          submitLabel="Enregistrer les modifications"
          loading={loading}
          error={error}
          onSubmit={async (values) => {
            setLoading(true);
            setError(null);
            try {
              await api.post(`/products/${id}`, productFormData(values, "PUT"), { headers: { "Content-Type": "multipart/form-data" } });
              router.push("/mes-produits");
            } catch (err) {
              setError(apiError(err, "Erreur lors de la modification du produit."));
              setLoading(false);
            }
          }}
        />
      )}
    </DashboardLayout>
  );
}
