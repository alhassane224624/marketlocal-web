"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Alert, apiError, Avatar, Badge, Card, EmptyState, LoadingRows, PageHeader, Pagination, Select } from "@/components/ui";

interface LogEntry {
  id: number;
  action: string;
  description: string;
  admin: string;
  created_at: string;
}

interface JournalPage {
  key: string;
  logs: LogEntry[];
  meta: { page: number; last_page: number; total: number };
}

// Codes enregistrés par l'API (AdminLog::record) et leur libellé.
const actions: Record<string, { label: string; tone: "olive" | "saffron" | "red" | "sky" | "terra" | "ink" }> = {
  utilisateur_cree: { label: "Compte créé", tone: "olive" },
  utilisateur_modifie: { label: "Compte modifié", tone: "sky" },
  utilisateur_suspendu: { label: "Compte suspendu", tone: "red" },
  utilisateur_reactive: { label: "Compte réactivé", tone: "olive" },
  boutique_validee: { label: "Boutique validée", tone: "olive" },
  boutique_refusee: { label: "Boutique refusée", tone: "red" },
  commission_modifiee: { label: "Commission", tone: "saffron" },
  commande_statut: { label: "Statut de commande", tone: "sky" },
  commande_remboursee: { label: "Remboursement", tone: "terra" },
  litige_resolu: { label: "Litige réglé", tone: "terra" },
  livreur_paye: { label: "Livreur payé", tone: "saffron" },
  categorie_creee: { label: "Catégorie créée", tone: "ink" },
  categorie_modifiee: { label: "Catégorie modifiée", tone: "ink" },
  categorie_supprimee: { label: "Catégorie supprimée", tone: "ink" },
};

export default function AdminJournalPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<JournalPage | null>(null);
  const [error, setError] = useState("");

  const requestKey = `${action}|${page}`;

  useEffect(() => {
    api
      .get("/admin/journal", { params: { action: action || undefined, page } })
      .then((r) => setResult({ key: requestKey, logs: r.data.data, meta: r.data.meta }))
      .catch((err) => {
        setError(apiError(err, "Impossible de charger le journal."));
        setResult({ key: requestKey, logs: [], meta: { page: 1, last_page: 1, total: 0 } });
      });
    // requestKey résume action et page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const loading = result?.key !== requestKey;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Administration"
        title="Journal"
        description="Les actions des administrateurs : comptes, boutiques, commandes, remboursements et litiges."
        actions={
          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            aria-label="Type d’action"
            className="sm:w-64"
          >
            <option value="">Toutes les actions</option>
            {Object.entries(actions).map(([code, a]) => (
              <option key={code} value={code}>{a.label}</option>
            ))}
          </Select>
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingRows rows={5} />
      ) : !result || result.logs.length === 0 ? (
        <EmptyState icon={History} title="Aucune action" description="Les actions des administrateurs apparaîtront ici." />
      ) : (
        <Card>
          <ul className="divide-y divide-sand-100">
            {result.logs.map((log) => {
              const a = actions[log.action] ?? { label: log.action, tone: "ink" as const };
              return (
                <li key={log.id} className="flex items-start gap-3 px-5 py-4">
                  <Avatar name={log.admin} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-900">{log.description}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {log.admin} · {new Date(log.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <Badge tone={a.tone}>{a.label}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {result && result.meta.last_page > 1 && (
        <Pagination page={result.meta.page} lastPage={result.meta.last_page} total={result.meta.total} onChange={setPage} />
      )}
    </DashboardLayout>
  );
}
