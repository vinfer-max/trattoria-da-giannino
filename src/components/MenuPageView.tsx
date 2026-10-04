import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMenuPage } from "@/lib/menu";
import MenuSection from "./MenuSection";

export default function MenuPageView({
  page,
  icon,
  title,
  subtitle,
  showIndex = false,
  note,
}: {
  page: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  showIndex?: boolean;
  note?: string;
}) {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["menu", page],
    queryFn: () => getMenuPage(page),
  });

  return (
    <div className="pt-20 sm:pt-24">
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-10 h-10 text-amber-500 mx-auto mb-4 [&>svg]:w-10 [&>svg]:h-10">{icon}</div>
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-100 mb-3">{title}</h1>
          <p className="text-stone-400 text-lg">{subtitle}</p>
        </div>
      </section>

      {showIndex && !isLoading && categories.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.slug}`}
                className="px-3 py-1.5 text-xs tracking-wide text-stone-400 hover:text-amber-400 border border-stone-800 hover:border-amber-500/30 rounded-full transition-colors"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400">Caricamento…</div>
        ) : (
          <>
            {note && <p className="text-sm text-stone-400 italic mb-8 text-center">{note}</p>}
            <MenuSection categories={categories} />
          </>
        )}
      </section>
    </div>
  );
}
