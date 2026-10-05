"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, Badge, Card, EmptyState, formatDate, LoadingRows, PageHeader, SearchInput, Segmented } from "@/components/ui";

interface UserAdmin {
  id: number;
  name: string;
  email: string;
  role: "acheteur" | "vendeur" | "admin";
  telephone?: string | null;
  ville?: string | null;
  created_at: string;
}

const roleBadge = {
  acheteur: { label: "Acheteur", tone: "saffron" as const },
  vendeur: { label: "Vendeur", tone: "terra" as const },
  admin: { label: "Admin", tone: "olive" as const },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get("/admin/users")
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => users.filter((u) => (filter === null || u.role === filter) && `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())),
    [users, filter, q],
  );

  const count = (role: string | null) => (role ? users.filter((u) => u.role === role).length : users.length);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Administration" title="Utilisateurs" description="Les comptes acheteurs, vendeurs et administrateurs." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          options={[
            { value: null, label: "Tous", count: count(null) },
            { value: "acheteur", label: "Acheteurs", count: count("acheteur") },
            { value: "vendeur", label: "Vendeurs", count: count("vendeur") },
            { value: "admin", label: "Admins", count: count("admin") },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Nom ou e-mail…" />
      </div>

      {loading ? (
        <LoadingRows rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun compte ne correspond à cette recherche." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-sand-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-3 font-semibold">Utilisateur</th>
                  <th className="px-5 py-3 font-semibold">Rôle</th>
                  <th className="px-5 py-3 font-semibold">Ville</th>
                  <th className="px-5 py-3 font-semibold">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition hover:bg-sand-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{u.name}</p>
                          <p className="truncate text-xs text-ink-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge tone={roleBadge[u.role].tone}>{roleBadge[u.role].label}</Badge></td>
                    <td className="px-5 py-3 text-ink-600">{u.ville || "—"}</td>
                    <td className="px-5 py-3 text-ink-600">{formatDate(u.created_at)}</td>
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
