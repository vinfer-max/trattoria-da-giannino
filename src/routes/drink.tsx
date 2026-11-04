import { createFileRoute } from "@tanstack/react-router";
import { GlassWater } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/drink")({
  head: () => ({
    meta: [
      { title: "Drink List — Trattoria da Giannino est. 1974" },
      { name: "description", content: "Cocktail, birre e spirits di Trattoria da Giannino est. 1974." },
      { property: "og:title", content: "Drink List — Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "Cocktail, birre e spirits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <MenuPageView page="drink" icon={<GlassWater />} title="Drink List" subtitle="Cocktail, birre e spirits" showIndex />
  ),
});
