import { useEffect, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getMenuPage, getPageDirectItems, type CategoryWithItems } from "@/lib/menu";
import { getPageBySlug } from "@/lib/cms";
import MenuSection from "./MenuSection";
import RichText from "./RichText";
import { plainName } from "@/lib/rich-name";
import { PageIcon } from "@/lib/page-icons";

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
  const pageRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLElement>(null);
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["menu", page],
    queryFn: () => getMenuPage(page),
  });
  const { data: direct = [] } = useQuery({ queryKey: ["menu-direct", page], queryFn: () => getPageDirectItems(page) });
  const { data: pageInfo } = useQuery({ queryKey: ["page", page], queryFn: () => getPageBySlug(page) });
  if (pageInfo) {
    title = pageInfo.title || title;
    subtitle = pageInfo.subtitle ?? "";
  }
  const pageIcon = <PageIcon name={pageInfo?.icon} fallback={icon} />;
  const all: CategoryWithItems[] = direct.length
    ? [{ id: "direct", slug: "prodotti", name: "", page, items: direct, children: [], description: "", time_range: "", cover_charge: 0, sort_order: 0, parent_id: null, is_visible: true, created_at: null } as CategoryWithItems, ...categories]
    : categories;

  useEffect(() => {
    const index = indexRef.current;
    const container = pageRef.current;
    if (!index || !container) return;
    const updateHeight = () => container.style.setProperty("--menu-index-height", `${index.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(index);
    return () => observer.disconnect();
  }, [showIndex, isLoading, categories.length]);

  return (
    <div ref={pageRef} className={`pt-20 sm:pt-24 ${showIndex ? "menu-page--indexed" : ""}`}>
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-10 h-10 text-amber-500 mx-auto mb-4 [&>svg]:w-10 [&>svg]:h-10">{pageIcon}</div>
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-100 mb-3">{title}</h1>
          {subtitle && <RichText html={subtitle} className="text-stone-400 text-lg" />}
        </div>
      </section>

      {showIndex && !isLoading && categories.length > 0 && (
        <nav ref={indexRef} aria-label="Categorie della carta dei vini" className="sticky top-16 sm:top-20 z-30 bg-site-bg border-y border-site-border/50 mb-8">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex flex-wrap gap-x-1 gap-y-1 sm:gap-2 justify-center">
            {categories.map((cat) => (
              <Button key={cat.id} asChild variant="outline" size="sm" className="h-auto min-h-7 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs leading-tight whitespace-normal text-center font-normal text-site-muted hover:text-site-accent bg-site-bg hover:bg-site-panel border-site-border hover:border-site-accent/30 rounded-full">
              <a
                href={`#${cat.slug}`}
              >
                {plainName(cat.name)}
              </a>
              </Button>
            ))}
          </div>
        </nav>
      )}

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? (
          <div className="text-center py-12 text-stone-400">Caricamento…</div>
        ) : (
          <>
            {note && <p className="text-sm text-stone-400 italic mb-8 text-center">{note}</p>}
            {pageInfo?.content && <RichText html={pageInfo.content} className="text-stone-300 mb-12" />}
            <MenuSection categories={all} />
          </>
        )}
      </section>
    </div>
  );
}
