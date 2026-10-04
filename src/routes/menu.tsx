import { createFileRoute } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menù — Giannino Bistrot Cafè" },
      { name: "description", content: "La proposta culinaria di Giannino Bistrot Cafè: colazione, brunch, pranzo e aperitivi." },
      { property: "og:title", content: "Menù — Giannino Bistrot Cafè" },
      { property: "og:description", content: "La nostra proposta culinaria." },
    ],
  }),
  component: () => (
    <MenuPageView page="menu" icon={<UtensilsCrossed />} title="Menù" subtitle="La nostra proposta culinaria" />
  ),
});
