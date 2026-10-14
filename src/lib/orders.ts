// Ordre d'avancement : dans une commande multi-vendeurs, le statut global peut
// différer de celui des articles d'une boutique (seuls renvoyés par /shop/orders).
const progression = ["en_attente", "payee", "expediee", "livree"];

/** Statut des articles d'une boutique dans une commande : le moins avancé d'entre eux. */
export function shopStatut(order: { statut: string; items: { statut?: string }[] }): string {
  const statuts = order.items.map((i) => i.statut).filter((s): s is string => Boolean(s));
  if (statuts.length === 0) return order.statut;
  if (statuts.every((s) => s === "annulee")) return "annulee";
  return statuts
    .filter((s) => s !== "annulee")
    .reduce((min, s) => (progression.indexOf(s) < progression.indexOf(min) ? s : min));
}

/** Montant des lignes visibles (pour un vendeur : ses articles uniquement). */
export function itemsTotal(order: { items: { quantite: number; prix_unitaire: string | number }[] }): number {
  return order.items.reduce((sum, i) => sum + Number(i.prix_unitaire) * i.quantite, 0);
}

/** Paiement à la livraison ? (champ absent sur les anciennes réponses = carte) */
export function isCashOnDelivery(order: { mode_paiement?: string }): boolean {
  return order.mode_paiement === "livraison";
}

/**
 * Articles du vendeur prêts à partir : payés par carte, ou commande à la livraison
 * pas encore expédiée (pas d'étape « payée » dans ce cas).
 */
export function readyToShip(order: { statut: string; mode_paiement?: string; items: { statut?: string }[] }): boolean {
  const statut = shopStatut(order);
  return statut === "payee" || (isCashOnDelivery(order) && statut === "en_attente");
}
