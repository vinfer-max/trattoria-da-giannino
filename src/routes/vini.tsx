import { createFileRoute } from "@tanstack/react-router";
import { Wine } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";

export const Route = createFileRoute("/vini")({
  head: () => ({
    meta: [
      { title: "Carta dei Vini — Trattoria da Giannino est. 1974" },
      { name: "description", content: "Selezione di etichette siciliane, nazionali e internazionali." },
      { property: "og:title", content: "Carta dei Vini — Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "Selezione di etichette siciliane, nazionali e internazionali." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <MenuPageView
      page="vini"
      icon={<Wine />}
      title="Carta dei Vini"
      subtitle="Selezione di etichette siciliane, nazionali e internazionali"
      showIndex
      note="I prezzi si intendono per bottiglia. Per disponibilità di annate diverse o calici fuori carta, chiedere al sommelier."
    />
  ),
});
