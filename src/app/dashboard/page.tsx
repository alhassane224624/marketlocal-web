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
import { fetchAllShops, fetchStats, validateShop } from "@/features/admin/adminSlice";
import api from "@/lib/axios";
import { deliveryLabel, isActiveDelivery, type Delivery } from "@/lib/deliveries";
import { itemsTotal, readyToShip } from "@/lib/orders";
import DashboardLayout from "@/components/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
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
  mode_paiement?: "carte" | "livraison";
  created_at: string;
  buyer?: { name: string; email: string };
  items: { id: number; quantite: number; statut?: string; prix_unitaire: string; product: { nom: string } }[];
  deliveries?: Delivery[];
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
  finances?: { verse: number; en_attente: number; especes: number; commission_especes: number };
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

/** Argent encaissé : carte payée, ou paiement à la livraison une fois livré. */
const isPaid = (o: { statut: string; mode_paiement?: string }) =>
  o.mode_paiement === "livraison" ? o.statut === "livree" : ["payee", "expediee", "livree"].includes(o.statut);

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
  const cod = (o: Order) => o.mode_paiement === "livraison";
  // Paiement à la livraison : une commande « en_attente » est déjà confirmée, pas « à payer ».
  const inProgress = list.filter((o) => ["payee", "expediee"].includes(o.statut) || (cod(o) && o.statut === "en_attente")).length;
  const toPay = list.filter((o) => o.statut === "en_attente" && !cod(o)).length;
  const delivered = list.filter((o) => o.statut === "livree").length;
  const spent = list.filter((o) => isPaid(o)).reduce((s, o) => s + Number(o.total), 0);

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
      // Publie une course : elle apparaît chez les livreurs dans « Courses disponibles ».
      await api.post(`/shop/orders/${id}/livreur`);
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

  const toShip = (orders || []).filter(readyToShip);
  // Produits en vente dont le stock est épuisé ou faible, les plus urgents d'abord.
  const lowStock = (shop?.products || [])
    .filter((p) => p.en_vente !== false && p.stock < 5)
    .sort((a, b) => a.stock - b.stock);
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
        <StatCard
          label="Commandes à expédier"
          value={orders === null ? "—" : toShip.length}
          icon={Truck}
          tone="saffron"
          hint={stats ? `${stats.total_commandes} commande${stats.total_commandes > 1 ? "s" : ""} au total` : undefined}
        />
        <StatCard
          label="Versements à venir"
          value={money(stats?.finances?.en_attente)}
          icon={Wallet}
          tone="sky"
          hint={stats?.finances ? <Link href="/mes-statistiques" className="hover:underline">{money(stats.finances.verse)} déjà versés</Link> : undefined}
        />
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
                  {(() => {
                    const course = (o.deliveries || []).find(isActiveDelivery);
                    return course ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">{deliveryLabel[course.statut]}</span>
                    ) : (
                      <Button size="sm" onClick={() => ship(o.id)} loading={shipping === o.id}>Demander un livreur</Button>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="Stock à surveiller"
            icon={AlertTriangle}
            description="Produits épuisés ou presque : réapprovisionnez-les pour ne pas manquer de ventes."
            action={<Link href="/mes-produits" className="text-sm font-semibold text-terra-700 hover:underline">Gérer les stocks</Link>}
          />
          <ul className="divide-y divide-sand-100">
            {lowStock.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <Link href={`/mes-produits/${p.id}`} className="min-w-0 truncate font-semibold text-ink-900 hover:text-terra-700">{p.nom}</Link>
                <span className={p.stock === 0 ? "shrink-0 font-semibold text-red-700" : "shrink-0 font-semibold text-saffron-700"}>
                  {p.stock === 0 ? "Épuisé" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Administrateur                                                      */
/* ------------------------------------------------------------------ */

/** « 1 litige ouvert » / « 3 litiges ouverts » (avec le nombre si withCount). */
function plural(n: number, one: string, many: string, withCount = false) {
  const word = n > 1 ? many : one;
  return withCount ? `${n} ${word}` : word;
}

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

  const [confirm, confirmDialog] = useConfirm();
  const pending = shops.filter((s) => s.statut === "en_attente");
  const points = salesByDay(orders || [], 30, false);

  const validate = async (shop: (typeof shops)[number]) => {
    const ok = await confirm({
      title: `Valider « ${shop.nom} » ?`,
      description: "La boutique devient visible dans le catalogue et le vendeur peut publier ses produits.",
      confirmLabel: "Valider la boutique",
    });
    if (ok) dispatch(validateShop(shop.id)).then(() => dispatch(fetchStats()));
  };

  // Ce qui demande une action de l'admin, avec un lien direct.
  const todo = stats
    ? [
        { count: stats.boutiques_en_attente, label: plural(stats.boutiques_en_attente, "boutique à valider", "boutiques à valider"), href: "/admin/commissions", icon: Store },
        { count: stats.litiges_ouverts ?? 0, label: plural(stats.litiges_ouverts ?? 0, "litige ouvert", "litiges ouverts"), href: "/admin/litiges", icon: AlertTriangle },
        { count: stats.livreurs_a_payer ?? 0, label: "à verser aux livreurs", href: "/admin/livreurs", icon: Truck, money: true },
        {
          count: stats.virements_vendeurs_echoues ?? 0,
          label: plural(stats.virements_vendeurs_echoues ?? 0, "virement vendeur échoué", "virements vendeurs échoués"),
          href: "/admin/commandes",
          icon: Wallet,
          hint: stats.virements_vendeurs_en_attente ? `${money(stats.virements_vendeurs_en_attente)} en attente au total` : undefined,
        },
      ]
    : [];
  const sales30 = points.reduce((s, p) => s + p.value, 0);

  return (
    <>
      {confirmDialog}
      <PageHeader eyebrow="Administration" title="Vue d’ensemble" description="L’activité de la marketplace en un coup d’œil." />

      {todo.length > 0 && (
        <section aria-label="À traiter" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {todo.map(({ count, label, href, icon: Icon, money: isMoney, hint }) => {
            const active = count > 0;
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition hover:shadow-soft ${
                  active ? "border-saffron-300 bg-saffron-50" : "border-sand-200 bg-white"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${active ? "bg-white text-saffron-700" : "bg-sand-100 text-ink-400"}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className={`block font-display text-xl font-semibold tabular-nums ${active ? "text-ink-900" : "text-ink-400"}`}>
                    {isMoney ? money(count) : count}
                  </span>
                  <span className="block truncate text-xs text-ink-600">{label}</span>
                  {hint && <span className="block truncate text-[11px] text-ink-500">{hint}</span>}
                </span>
              </Link>
            );
          })}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Chiffre d’affaires" value={money(stats?.chiffre_affaires_total)} icon={Coins} tone="terra" hint="Commandes payées" />
        <StatCard label="Commissions" value={money(stats?.commissions_total)} icon={Percent} tone="olive" hint="Revenu de la plateforme" />
        <StatCard label="Commandes" value={stats?.total_commandes ?? "—"} icon={ReceiptText} tone="sky" />
        <StatCard label="Utilisateurs" value={stats?.total_utilisateurs ?? "—"} icon={Users} tone="ink" hint={stats ? `${plural(stats.total_acheteurs, "acheteur", "acheteurs", true)} · ${plural(stats.total_vendeurs, "vendeur", "vendeurs", true)}` : undefined} />
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
                  {(s.activite || s.description) && <p className="mt-2 line-clamp-2 text-sm text-ink-600">{s.activite || s.description}</p>}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="success" onClick={() => validate(s)}>Valider</Button>
                    <ButtonLink size="sm" variant="outline" href="/admin/commissions">Examiner / refuser</ButtonLink>
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
