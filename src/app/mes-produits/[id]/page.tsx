"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCategories } from "@/features/categories/categorySlice";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";

export default function ModifierProduitPage() {
  const params = useParams();
  const id = params.id;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items: categories } = useAppSelector((state) => state.categories);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCategories());
    api.get(`/products/${id}`).then((res) => {
      const p = res.data;
      setNom(p.nom);
      setDescription(p.description || "");
      setPrix(String(p.prix));
      setStock(String(p.stock));
      setCategoryId(String(p.category.id));
      setCurrentImage(p.image);
      setFetching(false);
    });
  }, [dispatch, id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("description", description);
      formData.append("prix", prix);
      formData.append("stock", stock);
      formData.append("category_id", categoryId);
      if (image) {
        formData.append("image", image);
      }
      formData.append("_method", "PUT");

      await api.post(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push("/mes-produits");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.image?.[0] ||
        "Erreur lors de la modification du produit."
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <p className="text-gray-500 text-center py-12">Chargement...</p>
      </DashboardLayout>
    );
  }

  const displayedImage = preview || currentImage;

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Modifier le produit</h1>
          <Link href="/mes-produits" className="text-sm text-gray-600 hover:underline">
            Annuler
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo du produit
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {displayedImage ? (
                  <img src={displayedImage} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-1">
                    Pas d'image
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                className="text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:text-sm file:font-medium hover:file:bg-green-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (MAD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}