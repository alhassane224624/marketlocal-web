// Livraison par livreur (course libre, type Glovo) — même forme que DeliveryResource côté API.
export interface Delivery {
  id: number;
  order_id: number;
  statut: "disponible" | "acceptee" | "en_route" | "livree" | "annulee";
  mode_paiement: "carte" | "livraison";
  nb_articles: number;
  montant_articles: number;
  a_encaisser: number;
  frais: number;
  /** Visible par le livreur et l'admin uniquement. */
  remuneration_livreur: number | null;
  remuneration_payee: boolean;
  /** Dernière position du livreur (course en cours, mise à jour récente). */
  position: { lat: number; lng: number; at: string } | null;
  shop?: { id: number; nom: string };
  livreur?: { id: number; name: string; telephone: string | null } | null;
  retrait: { ville: string | null; adresse: string | null; telephone: string | null };
  destination: { ville: string | null; nom: string | null; adresse: string | null; telephone: string | null };
  code: string | null;
  created_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  /** Double confirmation : réception confirmée par le client (ou automatiquement après 48 h). */
  recu_confirme_at: string | null;
  recu_confirme_auto: boolean;
  probleme_signale: string | null;
  probleme_signale_at: string | null;
  confirmation_limite_at: string | null;
  /** Règlement du litige par l'admin. */
  litige_resolu_at: string | null;
  litige_resolution: "livreur" | "remboursement" | null;
  litige_note: string | null;
  rembourse_montant: number | null;
}

/** Où en est la confirmation du client pour un colis livré. */
export function receptionLabel(d: Delivery): { label: string; tone: "olive" | "saffron" | "red" } | null {
  if (d.statut !== "livree") return null;
  if (d.litige_resolution === "remboursement") return { label: "Litige réglé : client remboursé", tone: "red" };
  if (d.litige_resolution === "livreur") return { label: "Litige réglé en votre faveur", tone: "olive" };
  if (d.probleme_signale_at) return { label: "Problème signalé par le client (en cours d’examen)", tone: "red" };
  if (d.recu_confirme_at) return { label: d.recu_confirme_auto ? "Réception confirmée (auto)" : "Réception confirmée par le client", tone: "olive" };
  return { label: "En attente de confirmation du client", tone: "saffron" };
}

export const deliveryLabel: Record<Delivery["statut"], string> = {
  disponible: "En attente d’un livreur",
  acceptee: "Livreur en chemin vers le vendeur",
  en_route: "Colis en route",
  livree: "Livré",
  annulee: "Course annulée",
};

/** Course encore en cours (ni livrée ni annulée). */
export const isActiveDelivery = (d?: Delivery | null) => !!d && ["disponible", "acceptee", "en_route"].includes(d.statut);

export const timeOf = (value: string | null) =>
  value ? new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
