"use client";

import { useEffect, useState } from "react";
import { Bike, Wallet } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { Alert, apiError, Avatar, Button, Card, EmptyState, LoadingRows, money, PageHeader, StatCard } from "@/components/ui";

interface Livreur {
  id: number;
  name: string;
  email: string;
  telephone: string | null;
  ville: string | null;
  courses_livrees: number;
  courses_en_cours: number;
  gains_total: number;
  a_payer: number;
  litiges: number;
}

/**
 * Rémunération des livreurs. Paiement à la livraison : le livreur garde sa part sur les
 * espèces, rien à verser. Paiement carte : la plateforme lui doit sa part, versée ici.
 */
export default function AdminLivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[] | null>(null);
  const [paying, setPaying] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [confirm, confirmDialog] = useConfirm();

  const load = () =>
    api
      .get("/admin/livreurs")
      .then((r) => setLivreurs(r.data))
      .catch(() => setLivreurs([]));

  useEffect(() => {
    load();
  }, []);

  const pay = async (l: Livreur) => {
    const ok = await confirm({
      title: `Enregistrer le versement de ${money(l.a_payer)} à ${l.name} ?`,
      description: "Confirmez seulement après avoir réellement payé le livreur : ses courses seront marquées comme réglées.",
      confirmLabel: "Versement effectué",
    });
    if (!ok) return;
    setPaying(l.id);
    setMessage(null);
    try {
      await api.post(`/admin/livreurs/${l.id}/payer`);
      setMessage({ tone: "success", text: `Versement de ${money(l.a_payer)} à ${l.name} enregistré.` });
      await load();
    } catch (err) {
      setMessage({ tone: "error", text: apiError(err, "Impossible d’enregistrer le versement.") });
    } finally {
      setPaying(null);
    }
  };

  const list = livreurs || [];
  const totalDu = list.reduce((s, l) => s + l.a_payer, 0);

  return (
    <DashboardLayout>
      {confirmDialog}
      <PageHeader eyebrow="Administration" title="Livreurs" description="Rémunérations à verser pour les courses payées par carte, une fois la réception confirmée par le client." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Livreurs inscrits" value={list.length} icon={Bike} tone="sky" />
        <StatCard label="Total à verser" value={money(totalDu)} icon={Wallet} tone="terra" />
      </div>

      {message && <Alert tone={message.tone} className="mb-4">{message.text}</Alert>}

      {livreurs === null ? (
        <LoadingRows />
      ) : list.length === 0 ? (
        <EmptyState icon={Bike} title="Aucun livreur" description="Les livreurs s’inscrivent depuis la page d’inscription (« Je veux livrer »)." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-sand-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3 font-semibold">Livreur</th>
                  <th className="px-5 py-3 font-semibold">Courses</th>
                  <th className="px-5 py-3 text-right font-semibold">Gains totaux</th>
                  <th className="px-5 py-3 text-right font-semibold">À verser</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {list.map((l) => (
                  <tr key={l.id} className="transition hover:bg-sand-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={l.name} size="sm" />
                        <div>
                          <p className="font-semibold text-ink-900">{l.name}</p>
                          <p className="text-xs text-ink-500">{[l.telephone, l.ville].filter(Boolean).join(" · ") || l.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">
                      {l.courses_livrees} livrée{l.courses_livrees > 1 ? "s" : ""}
                      {l.courses_en_cours > 0 && <span className="ml-2 text-xs text-sky-700">{l.courses_en_cours} en cours</span>}
                      {l.litiges > 0 && <span className="ml-2 text-xs font-semibold text-red-700">{l.litiges} litige{l.litiges > 1 ? "s" : ""}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{money(l.gains_total)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-terra-700">{money(l.a_payer)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {l.a_payer > 0 && (
                        <Button size="sm" onClick={() => pay(l)} loading={paying === l.id}>
                          <Wallet size={13} /> Marquer versé
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
