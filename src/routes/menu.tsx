import { createFileRoute } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menù — Trattoria da Giannino est. 1974" },
      { name: "description", content: "La proposta culinaria di Trattoria da Giannino est. 1974: colazione, brunch, pranzo e aperitivi." },
      { property: "og:title", content: "Menù — Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "La nostra proposta culinaria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <MenuPageView page="menu" icon={<UtensilsCrossed />} title="Menù" subtitle="La nostra proposta culinaria" />
  ),
});
