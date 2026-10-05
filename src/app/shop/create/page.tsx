"use client";

import { useRouter } from "next/navigation";
import { BadgeCheck, PackageOpen, Store } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createShop } from "@/features/shop/shopSlice";
import DashboardLayout from "@/components/DashboardLayout";
import ShopForm from "@/components/ShopForm";
import { Card, PageHeader } from "@/components/ui";

const steps = [
  { icon: Store, title: "Présentez votre atelier", text: "Nom, logo et quelques lignes sur votre savoir-faire." },
  { icon: BadgeCheck, title: "Validation par l’équipe", text: "Un administrateur vérifie et publie votre boutique." },
  { icon: PackageOpen, title: "Publiez vos produits", text: "Ajoutez photos, prix et stock, puis recevez vos premières commandes." },
];

export default function CreateShopPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status, error } = useAppSelector((state) => state.shop);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Espace vendeur" title="Ouvrir ma boutique" description="Votre vitrine sur MarketLocal, visible après validation." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6 sm:p-8">
          <ShopForm
            submitLabel="Envoyer ma demande"
            loading={status === "loading"}
            error={status === "failed" ? error : null}
            onCancel={() => router.push("/dashboard")}
            onSubmit={async (values) => {
              const result = await dispatch(createShop(values));
              if (createShop.fulfilled.match(result)) router.push("/ma-boutique");
            }}
          />
        </Card>
        <ol className="space-y-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-4 rounded-2xl bg-sand-100 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-terra-600 shadow-soft">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-ink-500">Étape {i + 1}</p>
                <p className="font-semibold text-ink-900">{title}</p>
                <p className="mt-0.5 text-sm text-ink-600">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </DashboardLayout>
  );
}
