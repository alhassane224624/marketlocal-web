import { redirect } from "next/navigation";

// Ancienne page, remplacée par /mes-commandes-vendeur (lien du menu vendeur).
export default function MesCommandesRecuesPage() {
  redirect("/mes-commandes-vendeur");
}
