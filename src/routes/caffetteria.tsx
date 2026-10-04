import { createFileRoute } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/caffetteria")({
  head: () => ({
    meta: [
      { title: "Caffetteria — Giannino Bistrot Cafè" },
      { name: "description", content: "Caffè, cappuccino, tisane e dolci della tradizione." },
      { property: "og:title", content: "Caffetteria — Giannino Bistrot Cafè" },
      { property: "og:description", content: "Caffè, cappuccino, tisane e dolci della tradizione." },
    ],
  }),
  component: () => (
    <MenuPageView
      page="caffetteria"
      icon={<Coffee />}
      title="Caffetteria"
      subtitle="Caffè, cappuccino, tisane e dolci della tradizione"
    />
  ),
});
