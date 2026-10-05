"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, Card, EmptyState, formatDate, LoadingRows, PageHeader, Stars } from "@/components/ui";

interface Review {
  id: number;
  note: number;
  commentaire: string | null;
  created_at: string;
  product: { id: number; nom: string };
  user: { id: number; name: string };
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

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Espace vendeur" title="Avis clients" description="Ce que vos acheteurs pensent de vos produits." />

      {loading ? (
        <LoadingRows />
      ) : total === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="Pas encore d’avis" description="Les acheteurs peuvent noter un produit après l’avoir payé." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit p-6">
            <p className="font-display text-6xl font-semibold text-ink-900">{moyenne.toFixed(1).replace(".", ",")}</p>
            <Stars value={moyenne} size={18} className="mt-2" />
            <p className="mt-1 text-sm text-ink-500">{total} avis</p>
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = reviews.filter((r) => r.note === n).length;
                return (
                  <div key={n} className="flex items-center gap-3 text-sm">
                    <span className="w-3 text-ink-600">{n}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200">
                      <div className="h-full rounded-full bg-saffron-400" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="w-5 text-right tabular-nums text-ink-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={review.user.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{review.user.name}</p>
                        <p className="text-xs text-ink-500">{formatDate(review.created_at, true)}</p>
                      </div>
                    </div>
                    <Stars value={review.note} />
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-terra-700">{review.product.nom}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-700">
                    {review.commentaire || <span className="text-ink-500">Aucun commentaire.</span>}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardLayout>
  );
}
