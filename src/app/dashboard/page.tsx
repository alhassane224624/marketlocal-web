"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock,
  Coins,
  PackageCheck,
  PackageOpen,
  Percent,
  ReceiptText,
  ShoppingBag,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchMe } from "@/features/auth/authSlice";
import { fetchMyShop } from "@/features/shop/shopSlice";
import { fetchAllShops, fetchStats, refuseShop, validateShop } from "@/features/admin/adminSlice";
import api from "@/lib/axios";
import { itemsTotal, shopStatut } from "@/lib/orders";
import DashboardLayout from "@/components/DashboardLayout";
import SalesChart, { salesByDay } from "@/components/SalesChart";
import {
  Alert,
  apiError,
  Avatar,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  formatDate,
  LoadingRows,
  money,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui";

interface Order {
  id: number;
  statut: string;
  total: string;
  created_at: string;
  buyer?: { name: string; email: string };
  items: { id: number; quantite: number; statut?: string; prix_unitaire: string; product: { nom: string } }[];
}

interface ShopStats {
  produits_en_ligne: number;
  produits_en_rupture: number;
  total_commandes: number;
  commandes_en_cours: number;
  chiffre_affaires_net: number;
  chiffre_affaires_net_30j: number;
  chiffre_affaires_brut_30j: number;
  taux_commission: number;
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user) dispatch(fetchMe());
  }, [token, user, dispatch, router]);

  return (
    <DashboardLayout>
      {user?.role === "acheteur" && <Buyer name={user.name} />}
      {user?.role === "vendeur" && <Seller name={user.name} />}
      {user?.role === "admin" && <Admin />}
    </DashboardLayout>
  );
}

const firstName = (name: string) => name.split(" ")[0];

/* ------------------------------------------------------------------ */
/* Acheteur                                                            */
/* ------------------------------------------------------------------ */

function Buyer({ name }: { name: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api
      .get("/orders/mine")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  }, []);

  const list = orders || [];
  const inProgress = list.filter((o) => ["payee", "expediee"].includes(o.statut)).length;
  const toPay = list.filter((o) => o.statut === "en_attente").length;
  const delivered = list.filter((o) => o.statut === "livree").length;
  const spent = list.filter((o) => ["payee", "expediee", "livree"].includes(o.statut)).reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <PageHeader
        eyebrow="Espace acheteur"
        title={`Bonjour ${firstName(name)}`}
        description="Suivez vos commandes et retrouvez vos achats."
        actions={
          <ButtonLink href="/catalogue">
            Explorer le catalogue <ArrowRight size={16} />
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="En cours de livraison" value={inProgress} icon={Truck} tone="sky" />
        <StatCard label="À payer" value={toPay} icon={Clock} tone="saffron" hint={toPay ? "Stock réservé 30 min" : undefined} />
        <StatCard label="Livrées" value={delivered} icon={PackageCheck} tone="olive" />
        <StatCard label="Total dépensé" value={money(spent)} icon={Wallet} tone="terra" />
      </div>

      <Card className="mt-8">
        <CardHeader
          title="Commandes récentes"
          icon={ReceiptText}
          action={
            <Link href="/mes-commandes" className="text-sm font-semibold text-terra-700 hover:underline">
              Tout voir
            </Link>
          }
        />
        {orders === null ? (
          <div className="p-5"><LoadingRows /></div>
        ) : list.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ShoppingBag} title="Aucune commande pour l’instant" description="Vos achats apparaîtront ici." action={<ButtonLink href="/catalogue">Découvrir les produits</ButtonLink>} />
          </div>
        ) : (
          <ul className="divide-y divide-sand-100">
            {list.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link href={`/commandes/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-sand-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900">Commande #{o.id}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-ink-500">{o.items.map((i) => i.product.nom).join(", ")}</p>
                  </div>
                  <span className="text-sm text-ink-500">{formatDate(o.created_at)}</span>
                  <StatusBadge status={o.statut} />
                  <span className="w-28 text-right font-semibold tabular-nums">{money(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Vendeur                                                             */
/* ------------------------------------------------------------------ */

function Seller({ name }: { name: string }) {
  const dispatch = useAppDispatch();
  const { shop } = useAppSelector((s) => s.shop);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadOrders = () =>
    api
      .get("/shop/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));

  useEffect(() => {
    dispatch(fetchMyShop()).finally(() => setLoaded(true));
    api.get("/shop/stats").then((r) => setStats(r.data)).catch(() => {});
    loadOrders();
  }, [dispatch]);

  const ship = async (id: number) => {
    setShipping(id);
    setError("");
    try {
      await api.put(`/orders/${id}/statut`, { statut: "expediee" });
      await loadOrders();
    } catch (err) {
      setError(apiError(err, "Impossible de mettre à jour la commande."));
    } finally {
      setShipping(null);
    }
  };

  if (loaded && !shop) {
    return (
      <>
        <PageHeader eyebrow="Espace vendeur" title={`Bienvenue ${firstName(name)}`} />
        <EmptyState
          icon={Store}
          title="Ouvrez votre boutique"
          description="Présentez votre atelier en quelques lignes. Après validation par l’équipe, vous pourrez publier vos produits."
          action={<ButtonLink href="/shop/create">Créer ma boutique <ArrowRight size={16} /></ButtonLink>}
        />
      </>
    );
  }

  const toShip = (orders || []).filter((o) => shopStatut(o) === "payee");
  const points = salesByDay(orders || []);
  const sales30 = points.reduce((s, p) => s + p.value, 0);

  return (
    <>
      <PageHeader
        eyebrow={shop?.nom || "Espace vendeur"}
        title={`Bonjour ${firstName(name)}`}
        description="Voici l’activité de votre boutique."
        actions={
          <ButtonLink href="/mes-produits/nouveau">
            <PackageOpen size={16} /> Ajouter un produit
          </ButtonLink>
        }
      />

      {shop?.statut === "en_attente" && (
        <Alert tone="info" className="mb-6">
          <strong>Boutique en cours de validation.</strong> Vous pourrez publier des produits dès qu’un administrateur l’aura validée.
        </Alert>
      )}
      {shop?.statut === "refuse" && (
        <Alert className="mb-6">
          <strong>Boutique refusée.</strong> Modifiez sa présentation depuis « Ma boutique » ou contactez l’équipe.
        </Alert>
      )}
      {shop?.statut === "valide" && !shop.is_active && (
        <Alert tone="info" className="mb-6">
          Activez vos paiements Stripe depuis <Link href="/ma-boutique" className="font-semibold underline underline-offset-2">Ma boutique</Link> pour recevoir vos versements.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Ventes nettes (30 j)" value={money(stats?.chiffre_affaires_net_30j)} icon={Coins} tone="terra" hint={stats ? `Commission ${stats.taux_commission} % déduite` : undefined} />
        <StatCard label="Commandes à expédier" value={toShip.length} icon={Truck} tone="saffron" />
        <StatCard label="Commandes au total" value={stats?.total_commandes ?? "—"} icon={ReceiptText} tone="sky" />
        <StatCard
          label="Produits en ligne"
          value={stats?.produits_en_ligne ?? "—"}
          icon={PackageOpen}
          tone="olive"
          hint={stats?.produits_en_rupture ? <span className="text-red-700">{stats.produits_en_rupture} en rupture</span> : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Ventes des 30 derniers jours" description={`${money(sales30)} de ventes payées (brut)`} />
          <div className="p-5">
            {orders === null ? <LoadingRows rows={2} /> : <SalesChart points={points} label="Ventes payées par jour" />}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="À expédier"
            icon={Truck}
            action={<Link href="/mes-commandes-vendeur" className="text-sm font-semibold text-terra-700 hover:underline">Toutes</Link>}
          />
          {error && <Alert className="m-5 mb-0">{error}</Alert>}
          {orders === null ? (
            <div className="p-5"><LoadingRows rows={2} /></div>
          ) : toShip.length === 0 ? (
            <p className="flex items-center gap-2 p-5 text-sm text-ink-500">
              <BadgeCheck size={18} className="text-olive-600" /> Rien à expédier, tout est à jour.
            </p>
          ) : (
            <ul className="divide-y divide-sand-100">
              {toShip.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">#{o.id} · {o.buyer?.name}</p>
                    <p className="line-clamp-1 text-xs text-ink-500">{o.items.map((i) => `${i.product.nom} ×${i.quantite}`).join(", ")}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{money(itemsTotal(o))}</span>
                  <Button size="sm" onClick={() => ship(o.id)} loading={shipping === o.id}>Expédier</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Administrateur                                                      */
/* ------------------------------------------------------------------ */

function Admin() {
  const dispatch = useAppDispatch();
  const { stats, shops } = useAppSelector((s) => s.admin);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchAllShops());
    api
      .get("/admin/orders")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]));
  }, [dispatch]);

  const pending = shops.filter((s) => s.statut === "en_attente");
  const points = salesByDay(orders || [], 30, false);
  const sales30 = points.reduce((s, p) => s + p.value, 0);

  return (
    <>
      <PageHeader eyebrow="Administration" title="Vue d’ensemble" description="L’activité de la marketplace en un coup d’œil." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Chiffre d’affaires" value={money(stats?.chiffre_affaires_total)} icon={Coins} tone="terra" hint="Commandes payées" />
        <StatCard label="Commissions" value={money(stats?.commissions_total)} icon={Percent} tone="olive" hint="Revenu de la plateforme" />
        <StatCard label="Commandes" value={stats?.total_commandes ?? "—"} icon={ReceiptText} tone="sky" />
        <StatCard label="Utilisateurs" value={stats?.total_utilisateurs ?? "—"} icon={Users} tone="ink" hint={stats ? `${stats.total_acheteurs} acheteurs · ${stats.total_vendeurs} vendeurs` : undefined} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Ventes des 30 derniers jours" description={`${money(sales30)} encaissés sur la période`} />
          <div className="p-5">
            {orders === null ? <LoadingRows rows={2} /> : <SalesChart points={points} label="Ventes payées par jour" />}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Boutiques à valider"
            icon={AlertTriangle}
            action={<Link href="/admin/commissions" className="text-sm font-semibold text-terra-700 hover:underline">Gérer</Link>}
          />
          {pending.length === 0 ? (
            <p className="flex items-center gap-2 p-5 text-sm text-ink-500">
              <BadgeCheck size={18} className="text-olive-600" /> Aucune demande en attente.
            </p>
          ) : (
            <ul className="divide-y divide-sand-100">
              {pending.slice(0, 5).map((s) => (
                <li key={s.id} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.nom} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{s.nom}</p>
                      <p className="truncate text-xs text-ink-500">{s.user.name} · {s.user.email}</p>
                    </div>
                  </div>
                  {s.description && <p className="mt-2 line-clamp-2 text-sm text-ink-600">{s.description}</p>}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="success" onClick={() => dispatch(validateShop(s.id)).then(() => dispatch(fetchStats()))}>Valider</Button>
                    <Button size="sm" variant="danger" onClick={() => dispatch(refuseShop(s.id)).then(() => dispatch(fetchStats()))}>Refuser</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
