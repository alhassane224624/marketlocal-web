"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Star, MessageSquare } from "lucide-react";

interface Review {
  id: number;
  note: number;
  commentaire: string | null;
  created_at: string;
  product: { id: number; nom: string };
  user: { id: number; name: string };
}

function Stars({ note }: { note: number }) {
  return (
    <span className="text-yellow-500 tracking-tight">
      {"★".repeat(note)}
      <span className="text-gray-300">{"★".repeat(5 - note)}</span>
    </span>
  );
}

export default function MesAvisRecusPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/shop/reviews")
      .then((res) => setReviews(res.data))
      .finally(() => setLoading(false));
  }, []);

  const total = reviews.length;
  const moyenne = total > 0 ? reviews.reduce((s, r) => s + r.note, 0) / total : 0;
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    note: n,
    count: reviews.filter((r) => r.note === n).length,
  }));

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Avis clients</h1>
      <p className="text-gray-500 mb-6">Ce que vos clients pensent de vos produits</p>

      {loading && <p className="text-gray-500 text-center py-12">Chargement...</p>}

      {!loading && total === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <MessageSquare className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-gray-500">Vous n'avez pas encore reçu d'avis.</p>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Résumé */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center">
                <Star size={22} fill="currentColor" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800">{moyenne.toFixed(1)}</p>
                <p className="text-xs text-gray-500">
                  {total} avis
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {distribution.map((d) => (
                <div key={d.note} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-gray-500">{d.note}</span>
                  <Star size={12} className="text-yellow-500" fill="currentColor" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${(d.count / total) * 100}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-gray-500">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div className="lg:col-span-2 space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold">
                      {review.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{review.user.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <Stars note={review.note} />
                </div>
                <p className="text-xs text-green-700 font-medium mb-1">{review.product.nom}</p>
                <p className="text-sm text-gray-600">
                  {review.commentaire || <span className="text-gray-400">Aucun commentaire.</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}