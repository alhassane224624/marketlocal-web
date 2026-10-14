"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import ProductForm, { productFormData } from "@/components/ProductForm";
import { apiError, PageHeader } from "@/components/ui";

export default function NouveauProduitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Produits" title="Ajouter un produit" description="Il sera visible dans le catalogue dès l’enregistrement." />
      <ProductForm
        submitLabel="Publier le produit"
        loading={loading}
        error={error}
        onSubmit={async (values) => {
          setLoading(true);
          setError(null);
          try {
            await api.post("/products", productFormData(values), { headers: { "Content-Type": "multipart/form-data" } });
            router.push("/mes-produits");
          } catch (err) {
            setError(apiError(err, "Erreur lors de la création du produit. Vérifiez les champs."));
            setLoading(false);
          }
        }}
      />
    </DashboardLayout>
  );
}
