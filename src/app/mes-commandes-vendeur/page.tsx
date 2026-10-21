"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, Bike, Check, MapPin, PackageCheck, Phone, ReceiptText, Truck } from "lucide-react";
import api from "@/lib/axios";
import { deliveryLabel, isActiveDelivery, receptionLabel, type Delivery } from "@/lib/deliveries";
import { isCashOnDelivery, itemsTotal, readyToShip, shopStatut } from "@/lib/orders";
import DashboardLayout from "@/components/DashboardLayout";
import { useConfirm } from "@/components/ConfirmDialog";
import { Alert, apiError, Avatar, Button, Card, cn, EmptyState, formatDate, LoadingRows, money, PageHeader, Segmented, StatusBadge } from "@/components/ui";

interface ShopOrder {
  id: number;
  statut: string;
  mode_paiement?: "carte" | "livraison";
  created_at: string;
  ville_livraison?: string | null;
  buyer: { name: string; email: string };
  items: { id: number; quantite: number; statut: string; prix_unitaire: string; product: { nom: string } }[];
  deliveries?: Delivery[];
}

// « a_expedier » regroupe les commandes carte payées et les commandes à la livraison confirmées.
const filters = [
  { value: null, label: "Toutes" },
  { value: "a_expedier", label: "À expédier" },
  { value: "expediee", label: "Expédiées" },
  { value: "livree", label: "Livrées" },
  { value: "non_payee", label: "Non payées" },
];

/** Étapes affichées sous chaque commande ; l'étape courante dépend du mode de paiement. */
function OrderProgress({ order }: { order: ShopOrder }) {
  const statut = shopStatut(order);
  if (statut === "annulee") return null;
  const cod = isCashOnDelivery(order);
  const steps = cod ? ["Reçue", "Expédiée", "Livrée et encaissée"] : ["Payée", "Expédiée", "Livrée"];
  // Carte non payée : aucune étape franchie.
  const done = statut === "livree" ? 3 : statut === "expediee" ? 2 : statut === "payee" || cod ? 1 : 0;
  return (
    <ol className="mt-4 flex items-center gap-2 text-xs" aria-label="Avancement de la commande">
      {steps.map((label, i) => (
        <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={cn(
              "grid h-5 w-5 shrink-0 place-items-center rounded-full",
              i < done ? "bg-olive-600 text-white" : i === done ? "border-2 border-terra-500 bg-white" : "border border-sand-300 bg-white",
            )}
          >
            {i < done && <Check size={12} strokeWidth={3} />}
          </span>
          <span className={cn("truncate font-semibold", i < done ? "text-ink-800" : i === done ? "text-terra-700" : "text-ink-400")}>{label}</span>
          {i < steps.length - 1 && <span className={cn("h-px flex-1", i < done - 1 ? "bg-olive-400" : "bg-sand-200")} />}
        </li>
      ))}
    </ol>
  );
}

function filterKey(order: ShopOrder): string {
  if (readyToShip(order)) return "a_expedier";
  const statut = shopStatut(order);
  return statut === "en_attente" ? "non_payee" : statut;
}

export default function MesCommandesVendeurPage() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const load = () =>
    api
      .get("/shop/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (order: ShopOrder, statut: "expediee" | "livree") => {
    const id = order.id;
    const ok = await confirm(
      statut === "expediee"
        ? {
            title: `Expédier la commande #${id} vous-même ?`,
            description: "Le client verra la commande comme expédiée. Vous ne pourrez plus demander de livreur pour ce colis.",
            confirmLabel: "Oui, je l’expédie",
          }
        : {
            title: `Confirmer la livraison de la commande #${id} ?`,
            description: isCashOnDelivery(order)
              ? `Confirmez seulement si le client a reçu le colis et vous a payé ${money(itemsTotal(order))} en espèces. Cette action est définitive.`
              : "Confirmez seulement si le client a bien reçu son colis. Cette action est définitive.",
            confirmLabel: isCashOnDelivery(order) ? "Livrée et encaissée" : "Marquer livrée",
            tone: "danger",
          },
    );
    if (!ok) return;
    setUpdatingId(id);
    setError(null);
    try {
      await api.put(`/orders/${id}/statut`, { statut });
      await load();
    } catch (err) {
      setError(apiError(err, "Erreur lors de la mise à jour du statut."));
    } finally {
      setUpdatingId(null);
    }
  };

  const requestCourier = async (id: number) => {
    setUpdatingId(id);
    setError(null);
    try {
      await api.post(`/shop/orders/${id}/livreur`);
      await load();
    } catch (err) {
      setError(apiError(err, "Impossible de publier la course."));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter ? orders.filter((o) => filterKey(o) === filter) : orders;

  return (
    <DashboardLayout>
      {confirmDialog}
      <PageHeader eyebrow="Espace vendeur" title="Commandes reçues" description="Préparez, expédiez puis confirmez la livraison de vos articles." />

      {!loading && orders.length > 0 && (
        <div className="mb-6">
          <Segmented
            options={filters.map((f) => ({ ...f, count: f.value ? orders.filter((o) => filterKey(o) === f.value).length : orders.length }))}
            value={filter}
            onChange={setFilter}
          />
        </div>
      )}

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingRows />
      ) : orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Aucune commande pour l’instant" description="Les commandes contenant vos produits apparaîtront ici." />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-300 p-10 text-center text-sm text-ink-500">Aucune commande dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const statut = shopStatut(order);
            // Course livreur en cours pour ce colis : c'est elle qui fait avancer le statut.
            const course = (order.deliveries || []).find(isActiveDelivery) || null;
            // Colis livré par un livreur : le vendeur voit si le client a confirmé la réception.
            const livree = (order.deliveries || []).find((d) => d.statut === "livree") || null;
            const reception = livree ? receptionLabel(livree) : null;
            return (
              <Card key={order.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <Avatar name={order.buyer.name} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/commandes/${order.id}`} className="font-display text-lg font-semibold text-ink-900 hover:text-terra-700">
                          Commande #{order.id}
                        </Link>
                        <StatusBadge status={statut} label={isCashOnDelivery(order) && statut === "en_attente" ? "À préparer" : undefined} />
                        {isCashOnDelivery(order) && statut !== "annulee" && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-olive-700">
                            <Banknote size={13} /> {statut === "livree" ? "Encaissée en espèces" : "À encaisser à la livraison"}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-ink-500">
                        {order.buyer.name} · {formatDate(order.created_at)}
                        {order.ville_livraison && (
                          <span className="ml-2 inline-flex items-center gap-1"><MapPin size={13} />{order.ville_livraison}</span>
                        )}
                      </p>
                      <p className="mt-2 text-sm text-ink-700">{order.items.map((i) => `${i.product.nom} ×${i.quantite}`).join(" · ")}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                    <p className="font-display text-xl font-semibold tabular-nums">{money(itemsTotal(order))}</p>
                    {readyToShip(order) && !course && (
                      <>
                        <Button onClick={() => requestCourier(order.id)} loading={updatingId === order.id}>
                          <Bike size={16} /> Demander un livreur
                        </Button>
                        <Button variant="outline" onClick={() => updateStatus(order, "expediee")} disabled={updatingId === order.id}>
                          <Truck size={16} /> Je livre moi-même
                        </Button>
                      </>
                    )}
                    {statut === "expediee" && !course && (
                      <Button variant="success" onClick={() => updateStatus(order, "livree")} loading={updatingId === order.id}>
                        <PackageCheck size={16} /> {isCashOnDelivery(order) ? "Livrée et encaissée" : "Marquer livrée"}
                      </Button>
                    )}
                  </div>
                </div>
                <OrderProgress order={order} />
                {reception && (
                  <div
                    className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-4 py-3 text-sm ${
                      reception.tone === "olive" ? "bg-olive-50 text-olive-800" : reception.tone === "red" ? "bg-red-50 text-red-800" : "bg-saffron-50 text-saffron-700"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold"><PackageCheck size={16} /> {reception.label}</span>
                    {livree?.livreur && <span>Livré par {livree.livreur.name}</span>}
                    {livree?.probleme_signale && !livree.litige_resolu_at && <span>« {livree.probleme_signale} »</span>}
                  </div>
                )}
                {course && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    <span className="flex items-center gap-2 font-semibold"><Bike size={16} /> {deliveryLabel[course.statut]}</span>
                    {course.livreur && (
                      <span className="flex items-center gap-2">
                        {course.livreur.name}
                        {course.livreur.telephone && (
                          <a href={`tel:${course.livreur.telephone}`} className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
                            <Phone size={13} /> {course.livreur.telephone}
                          </a>
                        )}
                      </span>
                    )}
                    {course.statut === "acceptee" && <span className="text-sky-700">Préparez le colis : le livreur arrive.</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
