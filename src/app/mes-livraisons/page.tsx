"use client";

import { useEffect, useState } from "react";
import { Banknote, Bike, CheckCircle2, Coins, LocateFixed, MapPin, PackageCheck, Phone, Store, Undo2, Wallet } from "lucide-react";
import api from "@/lib/axios";
import type { Delivery } from "@/lib/deliveries";
import { receptionLabel, timeOf } from "@/lib/deliveries";
import { useShareLocation } from "@/lib/useShareLocation";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, apiError, Button, ButtonLink, Card, CardHeader, EmptyState, Input, LoadingRows, money, PageHeader, StatCard, StatusBadge } from "@/components/ui";

export default function MesLivraisonsPage() {
  const [courses, setCourses] = useState<Delivery[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [codes, setCodes] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [gains, setGains] = useState<{ courses_livrees: number; gains_total: number; gains_aujourdhui: number; a_recevoir: number; en_attente_confirmation: number } | null>(null);

  const load = () => {
    api.get("/livraisons/gains").then((r) => setGains(r.data)).catch(() => {});
    return api
      .get("/livraisons/mine")
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]));
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (course: Delivery, action: "recuperer" | "livrer" | "abandonner", success: string) => {
    setBusy(course.id);
    setMessage(null);
    try {
      await api.post(`/livraisons/${course.id}/${action}`, action === "livrer" ? { code: codes[course.id] || "" } : {});
      setMessage({ tone: "success", text: success });
      await load();
    } catch (err) {
      setMessage({ tone: "error", text: apiError(err, "Action impossible.") });
    } finally {
      setBusy(null);
    }
  };

  const list = courses || [];
  const actives = list.filter((c) => c.statut === "acceptee" || c.statut === "en_route");
  const terminees = list.filter((c) => c.statut === "livree");
  const today = new Date().toDateString();
  const livreesAujourdhui = terminees.filter((c) => c.delivered_at && new Date(c.delivered_at).toDateString() === today);
  const encaisseAujourdhui = livreesAujourdhui.reduce((s, c) => s + c.a_encaisser, 0);
  // Position partagée avec les clients tant qu'une course est en cours.
  const location = useShareLocation(actives.map((c) => c.id));

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Espace livreur"
        title="Mes courses"
        description="Suivez vos courses en cours et votre historique."
        actions={<ButtonLink href="/livraisons">Trouver une course</ButtonLink>}
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="En cours" value={actives.length} icon={Bike} tone="sky" hint="3 courses maximum à la fois" />
        <StatCard label="Gains aujourd’hui" value={money(gains?.gains_aujourdhui)} icon={Coins} tone="olive" hint={`${livreesAujourdhui.length} course(s) livrée(s)`} />
        <StatCard label="À recevoir" value={money(gains?.a_recevoir)} icon={Wallet} tone="terra" hint={gains?.en_attente_confirmation ? `+ ${money(gains.en_attente_confirmation)} en attente de confirmation client` : "Courses payées par carte, versées par MarketLocal"} />
        <StatCard label="Espèces encaissées aujourd’hui" value={money(encaisseAujourdhui)} icon={Banknote} tone="saffron" hint="Votre part déduite, le reste est à reverser" />
      </div>

      {actives.length > 0 && (
        <Alert tone={location === "sharing" ? "success" : location === "waiting" ? "info" : "error"} className="mb-4">
          <span className="inline-flex items-center gap-1.5">
            <LocateFixed size={15} />
            {location === "sharing" && "Votre position est partagée avec vos clients pendant la course."}
            {location === "waiting" && "Recherche de votre position…"}
            {location === "denied" && "Localisation refusée : autorisez-la dans votre navigateur pour que vos clients vous suivent sur la carte."}
            {location === "unavailable" && "Position indisponible sur cet appareil (la localisation demande HTTPS ou localhost)."}
          </span>
        </Alert>
      )}

      {message && <Alert tone={message.tone} className="mb-4">{message.text}</Alert>}

      {courses === null ? (
        <LoadingRows />
      ) : actives.length === 0 ? (
        <EmptyState icon={Bike} title="Aucune course en cours" description="Acceptez une course dans la liste des courses disponibles." action={<ButtonLink href="/livraisons">Voir les courses</ButtonLink>} />
      ) : (
        <div className="space-y-4">
          {actives.map((c) => (
            <Card key={c.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <p className="font-display text-xl font-semibold text-ink-900">Course #{c.id}</p>
                  <StatusBadge status={c.statut} />
                </div>
                <span className="flex flex-wrap items-center gap-2">
                  {c.remuneration_livreur !== null && (
                    <span className="rounded-full bg-terra-50 px-3 py-1 text-sm font-semibold text-terra-700">Gain {money(c.remuneration_livreur)}</span>
                  )}
                  {c.a_encaisser > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-50 px-3 py-1 text-sm font-semibold text-olive-800">
                      <Banknote size={15} /> Encaisser {money(c.a_encaisser)}
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Stop
                  icon={Store}
                  title={`Retrait · ${c.shop?.nom || "Vendeur"}`}
                  lines={[c.retrait.adresse, c.retrait.ville]}
                  phone={c.retrait.telephone}
                  done={c.statut === "en_route"}
                  doneLabel={c.picked_up_at ? `Récupéré ${timeOf(c.picked_up_at)}` : undefined}
                />
                <Stop
                  icon={MapPin}
                  title={`Livraison · ${c.destination.nom || "Client"}`}
                  lines={[c.destination.adresse, c.destination.ville]}
                  phone={c.destination.telephone}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-sand-100 pt-5">
                {c.statut === "acceptee" ? (
                  <>
                    <Button onClick={() => act(c, "recuperer", `Colis de la course #${c.id} récupéré.`)} loading={busy === c.id}>
                      <PackageCheck size={16} /> J’ai récupéré le colis
                    </Button>
                    <Button variant="ghost" onClick={() => act(c, "abandonner", `Course #${c.id} remise à disposition.`)} disabled={busy === c.id}>
                      <Undo2 size={16} /> Abandonner
                    </Button>
                  </>
                ) : (
                  <form
                    className="flex flex-wrap items-end gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      act(c, "livrer", `Course #${c.id} livrée. Le client doit maintenant confirmer la réception.`);
                    }}
                  >
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">Code donné par le client</span>
                      <Input
                        required
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        value={codes[c.id] || ""}
                        onChange={(e) => setCodes({ ...codes, [c.id]: e.target.value.replace(/\D/g, "") })}
                        className="w-32 text-center font-mono text-lg tracking-[0.4em]"
                        placeholder="••••"
                      />
                    </label>
                    <Button type="submit" variant="success" loading={busy === c.id}>
                      <CheckCircle2 size={16} /> Confirmer la livraison
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {terminees.length > 0 && (
        <Card className="mt-8">
          <CardHeader title="Historique" description="30 dernières courses livrées" icon={PackageCheck} />
          <ul className="divide-y divide-sand-100">
            {terminees.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <span>
                  <span className="font-semibold text-ink-900">#{c.id} · {c.shop?.nom}</span>
                  <span className="ml-2 text-ink-500">→ {c.destination.ville}</span>
                  {(() => {
                    const r = receptionLabel(c);
                    const color = r?.tone === "olive" ? "text-olive-700" : r?.tone === "red" ? "text-red-700" : "text-saffron-700";
                    return r && <span className={`mt-0.5 block text-xs font-semibold ${color}`}>{r.label}</span>;
                  })()}
                </span>
                <span className="flex items-center gap-3 text-ink-500">
                  {c.remuneration_livreur !== null && (
                    <span className={c.remuneration_payee ? "font-semibold text-olive-700" : "font-semibold text-terra-700"}>
                      +{money(c.remuneration_livreur)}{!c.remuneration_payee && " (à recevoir)"}
                    </span>
                  )}
                  {timeOf(c.delivered_at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </DashboardLayout>
  );
}

function Stop({
  icon: Icon,
  title,
  lines,
  phone,
  done,
  doneLabel,
}: {
  icon: typeof Store;
  title: string;
  lines: (string | null)[];
  phone: string | null;
  done?: boolean;
  doneLabel?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${done ? "border-olive-200 bg-olive-50/60" : "border-sand-200 bg-sand-50"}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Icon size={16} className="text-ink-500" /> {title}
      </p>
      <p className="mt-2 text-sm text-ink-700">{lines.filter(Boolean).join(", ") || "Adresse non renseignée"}</p>
      {phone && (
        <a href={`tel:${phone}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-terra-700 hover:underline">
          <Phone size={14} /> {phone}
        </a>
      )}
      {doneLabel && <p className="mt-2 text-xs font-semibold text-olive-700">{doneLabel}</p>}
    </div>
  );
}
