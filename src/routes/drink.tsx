import { createFileRoute } from "@tanstack/react-router";
import { GlassWater } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/drink")({
  head: () => ({
    meta: [
      { title: "Drink List — Giannino Bistrot Cafè" },
      { name: "description", content: "Cocktail, birre e spirits di Giannino Bistrot Cafè." },
      { property: "og:title", content: "Drink List — Giannino Bistrot Cafè" },
      { property: "og:description", content: "Cocktail, birre e spirits." },
    ],
  }),
  component: () => (
    <MenuPageView page="drink" icon={<GlassWater />} title="Drink List" subtitle="Cocktail, birre e spirits" showIndex />
  ),
});
