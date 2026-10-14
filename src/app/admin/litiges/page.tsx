"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, Bike, CheckCircle2, CreditCard, RotateCcw, ShieldAlert } from "lucide-react";
import api from "@/lib/axios";
import { timeOf, type Delivery } from "@/lib/deliveries";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, apiError, Badge, Button, Card, EmptyState, LoadingRows, money, PageHeader, Textarea } from "@/components/ui";

type Litige = Delivery & { acheteur: { name: string; email: string } | null; remboursable: number };

/**
 * Litiges : problème signalé par le client après la remise du colis.
 * L'admin donne raison au livreur, ou rembourse le client (Stripe si carte).
 */
export default function AdminLitigesPage() {
  const [litiges, setLitiges] = useState<Litige[] | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = () =>
    api
      .get("/admin/litiges")
      .then((r) => setLitiges(r.data))
      .catch(() => setLitiges([]));

  useEffect(() => {
    load();
  }, []);

  const list = litiges || [];
  const ouverts = list.filter((l) => !l.litige_resolu_at);
  const regles = list.filter((l) => l.litige_resolu_at);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Administration" title="Litiges" description="Problèmes signalés par les clients après la livraison." />
      {message && <Alert tone={message.tone} className="mb-4">{message.text}</Alert>}

      {litiges === null ? (
        <LoadingRows />
      ) : ouverts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Aucun litige en cours" description="Les problèmes signalés par les clients apparaîtront ici." />
      ) : (
        <div className="space-y-4">
          {ouverts.map((l) => (
            <LitigeCard key={l.id} litige={l} onDone={(text) => { setMessage({ tone: "success", text }); load(); }} onError={(text) => setMessage({ tone: "error", text })} />
          ))}
        </div>
      )}

      {regles.length > 0 && (
        <Card className="mt-8">
          <div className="border-b border-sand-100 px-5 py-4">
            <h2 className="text-[15px] font-bold text-ink-900">Litiges réglés</h2>
          </div>
          <ul className="divide-y divide-sand-100">
            {regles.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <span>
                  <Link href={`/commandes/${l.order_id}`} className="font-semibold text-ink-900 hover:text-terra-700">Commande #{l.order_id}</Link>
                  <span className="ml-2 text-ink-500">{l.shop?.nom} · {l.acheteur?.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">« {l.probleme_signale} »</span>
                </span>
                <span className="flex items-center gap-3">
                  {l.litige_resolution === "remboursement" ? (
                    <Badge tone="red">Remboursé {money(l.rembourse_montant)}</Badge>
                  ) : (
                    <Badge tone="olive">Livreur confirmé</Badge>
                  )}
                  <span className="text-xs text-ink-500">{timeOf(l.litige_resolu_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </DashboardLayout>
  );
}

function LitigeCard({ litige: l, onDone, onError }: { litige: Litige; onDone: (text: string) => void; onError: (text: string) => void }) {
  const [note, setNote] = useState("");
  const [payerLivreur, setPayerLivreur] = useState(true);
  const [busy, setBusy] = useState<"livreur" | "rembourser" | null>(null);
  const carte = l.mode_paiement === "carte";

  const resolve = async (decision: "livreur" | "rembourser") => {
    const question =
      decision === "rembourser"
        ? `Rembourser ${money(l.remboursable)} à ${l.acheteur?.name || "l’acheteur"}${carte ? " sur sa carte (Stripe)" : " (en dehors de la plateforme, payé en espèces)"} ?`
        : "Clore le litige en faveur du livreur ?";
    if (!confirm(question)) return;
    setBusy(decision);
    try {
      await api.post(`/admin/litiges/${l.id}/resoudre`, { decision, note: note || null, payer_livreur: payerLivreur });
      onDone(decision === "rembourser" ? `Commande #${l.order_id} : client remboursé de ${money(l.remboursable)}.` : `Commande #${l.order_id} : litige clos en faveur du livreur.`);
    } catch (err) {
      onError(apiError(err, "Impossible de régler ce litige."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-red-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/commandes/${l.order_id}`} className="font-display text-xl font-semibold text-ink-900 hover:text-terra-700">Commande #{l.order_id}</Link>
          <p className="mt-1 text-sm text-ink-500">
            {l.shop?.nom} → {l.acheteur?.name} ({l.acheteur?.email}) · signalé {timeOf(l.probleme_signale_at)}
          </p>
        </div>
        <Badge tone={carte ? "sky" : "olive"}>
          {carte ? <CreditCard size={12} /> : <Banknote size={12} />} {carte ? "Payé par carte" : "Payé à la livraison"}
        </Badge>
      </div>

      <blockquote className="mt-4 rounded-xl border-l-4 border-red-400 bg-red-50 px-4 py-3 text-[15px] text-ink-800">« {l.probleme_signale} »</blockquote>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-ink-500">Livreur</dt><dd className="font-semibold text-ink-900">{l.livreur?.name || "—"} {l.livreur?.telephone && <span className="font-normal text-ink-500">· {l.livreur.telephone}</span>}</dd></div>
        <div><dt className="text-ink-500">Remis le</dt><dd className="font-semibold text-ink-900">{timeOf(l.delivered_at)}</dd></div>
        <div><dt className="text-ink-500">Montant du colis</dt><dd className="font-semibold text-ink-900">{money(l.remboursable)} <span className="font-normal text-ink-500">(dont {money(l.frais)} de livraison)</span></dd></div>
      </dl>

      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message pour le client (facultatif) : explication de la décision…" className="mt-4" aria-label="Note de l’admin" />

      <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={payerLivreur} onChange={(e) => setPayerLivreur(e.target.checked)} className="h-4 w-4 accent-terra-600" />
        En cas de remboursement, rémunérer quand même le livreur ({money(l.remuneration_livreur)}) — décochez si la faute vient de lui.
      </label>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-sand-100 pt-4">
        <Button variant="danger" onClick={() => resolve("rembourser")} loading={busy === "rembourser"} disabled={busy !== null}>
          <RotateCcw size={16} /> Rembourser le client
        </Button>
        <Button variant="outline" onClick={() => resolve("livreur")} loading={busy === "livreur"} disabled={busy !== null}>
          <CheckCircle2 size={16} /> Donner raison au livreur
        </Button>
        <span className="ml-auto flex items-center gap-1.5 self-center text-xs text-ink-500">
          <Bike size={13} /> {carte ? "Carte : remboursement Stripe automatique, part du vendeur reprise." : "Espèces : remboursez le client hors plateforme, la décision est enregistrée."}
        </span>
      </div>
    </Card>
  );
}
