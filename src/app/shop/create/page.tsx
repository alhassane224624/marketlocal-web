"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createShop } from "@/features/shop/shopSlice";
import DashboardLayout from "@/components/DashboardLayout";

export default function CreateShopPage() {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status, error } = useAppSelector((state) => state.shop);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogo(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(createShop({ nom, description, logo }));

    if (createShop.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  return (
    <DashboardLayout>
    <div className="py-2">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Créer ma boutique
        </h1>
        <p className="text-gray-600 mb-6">
          Donnez un nom et une description à votre boutique. Elle sera
          visible après validation par un administrateur.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo de la boutique
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {preview ? (
                  <img src={preview} alt="Aperçu du logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-1">
                    Pas de logo
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleLogoChange}
                className="text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 file:text-sm file:font-medium hover:file:bg-orange-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la boutique
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Artisanat de Nador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Décrivez vos produits, votre savoir-faire..."
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-medium py-2 rounded-lg transition"
            >
              {status === "loading" ? "Création..." : "Créer ma boutique"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </DashboardLayout>
  );
}