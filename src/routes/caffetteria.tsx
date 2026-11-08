import { createFileRoute } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/caffetteria")({
  head: () => ({
    meta: [
      { title: "Caffetteria — Trattoria da Giannino est. 1974" },
      { name: "description", content: "La storia e la cucina della Trattoria da Giannino." },
      { property: "og:title", content: "Caffetteria — Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "La storia e la cucina della Trattoria da Giannino." },
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
