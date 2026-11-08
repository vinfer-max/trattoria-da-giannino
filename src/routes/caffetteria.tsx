import { createFileRoute } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/caffetteria")({
  head: () => ({
    meta: [
      { title: "Caffetteria — Trattoria da Giannino est. 1974" },
      { name: "description", content: "Caffè, cappuccino, tisane e dolci della tradizione." },
      { property: "og:title", content: "Caffetteria — Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "Caffè, cappuccino, tisane e dolci della tradizione." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <MenuPageView
      page="caffetteria"
      icon={<Coffee />}
      title="Caffetteria"
      subtitle=""
    />
  ),
});
