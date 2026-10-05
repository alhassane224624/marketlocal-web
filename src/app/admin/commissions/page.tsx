"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Store, X } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Alert,
  apiError,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  formatDate,
  inputClass,
  LoadingRows,
  PageHeader,
  SearchInput,
  Segmented,
  StatusBadge,
  cn,
} from "@/components/ui";

interface Shop {
  id: number;
  nom: string;
  description: string | null;
  statut: string;
  commission: string;
  is_active?: boolean;
  created_at?: string;
  user: { name: string; email: string };
}

const filters = [
  { value: null, label: "Toutes" },
  { value: "en_attente", label: "À valider" },
  { value: "valide", label: "Validées" },
  { value: "refuse", label: "Refusées" },
];

export default function AdminBoutiquesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/admin/shops")
      .then((r) => setShops(r.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const run = async (id: number, action: () => Promise<unknown>) => {
    setBusy(id);
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(apiError(err, "Action impossible."));
    } finally {
      setBusy(null);
    }
  };

  const saveCommission = (id: number) =>
    run(id, async () => {
      await api.put(`/admin/shops/${id}/commission`, { commission: Number(value) });
      setEditing(null);
    });

  const filtered = shops
    .filter((s) => (filter ? s.statut === filter : true))
    .filter((s) => `${s.nom} ${s.user.name} ${s.user.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Administration" title="Boutiques" description="Validez les demandes et ajustez la commission de chaque boutique." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          options={filters.map((f) => ({ ...f, count: f.value ? shops.filter((s) => s.statut === f.value).length : shops.length }))}
          value={filter}
          onChange={setFilter}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Boutique, vendeur…" />
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingRows />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title="Aucune boutique" description="Aucune boutique ne correspond à ces critères." />
      ) : (
        <div className="space-y-3">
          {filtered.map((shop) => (
            <Card key={shop.id} className={cn("p-5", shop.statut === "en_attente" && "border-saffron-300")}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <Avatar name={shop.nom} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold text-ink-900">{shop.nom}</p>
                      <StatusBadge status={shop.statut} label={shop.statut === "en_attente" ? "À valider" : undefined} />
                      {shop.statut === "valide" && (
                        <Badge tone={shop.is_active ? "olive" : "ink"}>{shop.is_active ? "Stripe actif" : "Stripe inactif"}</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {shop.user.name} · {shop.user.email}
                      {shop.created_at && ` · depuis le ${formatDate(shop.created_at)}`}
                    </p>
                    {shop.description && <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-ink-600">{shop.description}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  {editing === shop.id ? (
                    <div className="flex items-center gap-2">
                      <label className="relative">
                        <span className="sr-only">Commission en %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className={cn(inputClass, "h-9 w-24 pr-7")}
                          autoFocus
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">%</span>
                      </label>
                      <Button size="sm" variant="dark" onClick={() => saveCommission(shop.id)} loading={busy === shop.id} aria-label="Enregistrer">
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)} aria-label="Annuler">
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(shop.id);
                        setValue(String(Number(shop.commission)));
                      }}
                      className="group flex items-center gap-2 rounded-xl border border-sand-200 px-3 py-1.5 text-left hover:border-sand-300"
                    >
                      <span>
                        <span className="block text-[11px] text-ink-500">Commission</span>
                        <span className="font-semibold tabular-nums text-ink-900">{Number(shop.commission)} %</span>
                      </span>
                      <Pencil size={14} className="text-ink-400 group-hover:text-ink-700" />
                    </button>
                  )}

                  {shop.statut === "en_attente" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => run(shop.id, () => api.put(`/admin/shops/${shop.id}/valider`))} loading={busy === shop.id}>
                        Valider
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => run(shop.id, () => api.put(`/admin/shops/${shop.id}/refuser`))}>
                        Refuser
                      </Button>
                    </>
                  )}
                  {shop.statut === "refuse" && (
                    <Button size="sm" variant="outline" onClick={() => run(shop.id, () => api.put(`/admin/shops/${shop.id}/valider`))} loading={busy === shop.id}>
                      Revalider
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
