"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, Banknote, MapPinned, Package, RefreshCw, Store } from "lucide-react";
import api from "@/lib/axios";
import type { Delivery } from "@/lib/deliveries";
import { timeOf } from "@/lib/deliveries";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, apiError, Button, ButtonLink, Card, EmptyState, LoadingRows, money, PageHeader, SearchInput } from "@/components/ui";

/** Courses libres : le premier livreur qui accepte prend la course (modèle Glovo). */
export default function CoursesDisponiblesPage() {
  const [courses, setCourses] = useState<Delivery[] | null>(null);
  const [ville, setVille] = useState("");
  const [accepting, setAccepting] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = useCallback(
    () =>
      api
        .get("/livraisons/disponibles", { params: ville ? { ville } : {} })
        .then((r) => setCourses(r.data))
        .catch(() => setCourses([])),
    [ville],
  );

  // Rafraîchissement automatique : de nouvelles courses arrivent, d'autres sont prises.
  useEffect(() => {
    const first = setTimeout(load, 250);
    const timer = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const accept = async (course: Delivery) => {
    setAccepting(course.id);
    setMessage(null);
    try {
      await api.post(`/livraisons/${course.id}/accepter`);
      setMessage({ tone: "success", text: `Course #${course.id} acceptée. Rendez-vous chez ${course.shop?.nom || "le vendeur"}.` });
    } catch (err) {
      setMessage({ tone: "error", text: apiError(err, "Impossible d’accepter cette course.") });
    } finally {
      setAccepting(null);
      load();
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Espace livreur"
        title="Courses disponibles"
        description="Acceptez une course, récupérez le colis chez le vendeur, puis remettez-le au client contre son code."
        actions={
          <>
            <Button variant="outline" onClick={() => load()}>
              <RefreshCw size={16} /> Actualiser
            </Button>
            <ButtonLink href="/mes-livraisons" variant="dark">Mes courses</ButtonLink>
          </>
        }
      />

      <div className="mb-6">
        <SearchInput value={ville} onChange={setVille} placeholder="Filtrer par ville de livraison" />
      </div>

      {message && (
        <Alert tone={message.tone} className="mb-4">
          {message.text}{" "}
          {message.tone === "success" && <Link href="/mes-livraisons" className="font-semibold underline">Voir mes courses</Link>}
        </Alert>
      )}

      {courses === null ? (
        <LoadingRows />
      ) : courses.length === 0 ? (
        <EmptyState icon={MapPinned} title="Aucune course pour le moment" description="La liste se met à jour toute seule toutes les 15 secondes." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Course #{course.id}</p>
                  <p className="mt-1 text-xs text-ink-500">Publiée {timeOf(course.created_at)}</p>
                </div>
                {course.a_encaisser > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-50 px-3 py-1 text-xs font-semibold text-olive-800">
                    <Banknote size={14} /> {money(course.a_encaisser)} à encaisser
                  </span>
                ) : (
                  <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">Déjà payée</span>
                )}
              </div>

              <ol className="mt-5 space-y-1">
                <li className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-terra-50 text-terra-700"><Store size={15} /></span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{course.shop?.nom}</span>
                    <span className="text-sm text-ink-500">Retrait · {course.retrait.ville || "Ville non renseignée"}</span>
                  </span>
                </li>
                <li className="pl-2.5 text-ink-300" aria-hidden><ArrowDown size={14} /></li>
                <li className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-olive-50 text-olive-700"><MapPinned size={15} /></span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{course.destination.ville || "Ville non renseignée"}</span>
                    <span className="text-sm text-ink-500">Adresse exacte visible après acceptation</span>
                  </span>
                </li>
              </ol>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-sand-100 pt-4">
                <span className="text-sm text-ink-600">
                  <span className="flex items-center gap-1.5"><Package size={15} /> {course.nb_articles} article{course.nb_articles > 1 ? "s" : ""}</span>
                  {course.remuneration_livreur !== null && (
                    <span className="mt-0.5 block font-semibold text-terra-700">Votre gain : {money(course.remuneration_livreur)}</span>
                  )}
                </span>
                <Button onClick={() => accept(course)} loading={accepting === course.id}>Accepter la course</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
