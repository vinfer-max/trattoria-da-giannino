import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import MenuPageView from "@/components/MenuPageView";
import { getPageBySlug } from "@/lib/cms";

export const Route = createFileRoute("/p/$slug")({
  head: ({ params }) => {
    const t = params.slug.replace(/-/g, " ");
    const title = `${t.charAt(0).toUpperCase()}${t.slice(1)} — Giannino Bistrot Cafè`;
    return {
      meta: [
        { title },
        { name: "description", content: `${t} — Giannino Bistrot Cafè, Santo Stefano di Camastra.` },
        { property: "og:title", content: title },
        { property: "og:description", content: `${t} — Giannino Bistrot Cafè.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: DynamicPage,
});

function DynamicPage() {
  const { slug } = Route.useParams();
  const { data: page, isLoading } = useQuery({ queryKey: ["page", slug], queryFn: () => getPageBySlug(slug) });
  if (isLoading) return <div className="pt-32 text-center text-stone-400">Caricamento…</div>;
  if (!page || !page.is_visible) return <div className="pt-32 pb-20 text-center text-stone-400">Pagina non trovata.</div>;
  return <MenuPageView page={page.slug} icon={<BookOpen />} title={page.title} subtitle={page.subtitle ?? ""} showIndex />;
}
