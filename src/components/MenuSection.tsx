import RichText from "./RichText";
import type { CategoryWithItems } from "@/lib/menu";
import { formatPrice as fmt } from "@/lib/price";

function formatPrice(price: number): string {
  if (price === 0) return "";
  return `€ ${fmt(price)}`;
}

const WINE_SLUGS = [
  "champagne", "spumanti",
  "vini-bianchi-sicilia", "vini-bianchi-etna", "vini-bianchi-nazionali", "vini-bianchi-internazionali",
  "vini-rosati",
  "vini-rossi-sicilia", "vini-rossi-etna", "vini-rossi-nazionali", "vini-rossi-internazionali",
];
const COCKTAILS_SLUG = "cocktails";
const SIGNATURE_SORT = 1;
const MIXOLOGY_START_SORT = 2;
const MIXOLOGY_ZERO_START_SORT = 20;

function Category({ category, depth }: { category: CategoryWithItems; depth: number }) {
  const isWine = WINE_SLUGS.includes(category.slug);
  const isCocktails = category.slug === COCKTAILS_SLUG;
  const cover = Number(category.cover_charge ?? 0);

  return (
    <section id={category.slug} className="scroll-mt-24">
      <div className={`flex items-baseline justify-between border-b border-stone-700/50 ${depth === 0 ? "mb-6 pb-3" : "mb-4 pb-2 mt-6"}`}>
        <h2 className={depth === 0 ? "text-2xl sm:text-3xl font-serif text-amber-400" : "text-lg sm:text-xl font-serif text-amber-300/90"}>
          {category.name}
        </h2>
        {category.time_range && <span className="text-sm text-stone-400 tracking-wide">{category.time_range}</span>}
      </div>

      {category.description && <RichText html={category.description} className="text-stone-300 mb-4" />}

      {cover > 0 && (
        <p className="text-sm text-stone-400 mb-4 italic">Coperto: € {fmt(cover)}</p>
      )}

      <ul className="space-y-3">
        {category.items.map((item) => {
          let subLabel: string | null = null;
          if (isCocktails) {
            if (item.sort_order === SIGNATURE_SORT) subLabel = "Signature Drink";
            else if (item.sort_order === MIXOLOGY_START_SORT) subLabel = "Mixology";
            else if (item.sort_order === MIXOLOGY_ZERO_START_SORT) subLabel = "Mixology Zero";
          }
          const price = Number(item.price);

          return (
            <li key={item.id}>
              {subLabel && (
                <div className="text-xs tracking-[0.2em] uppercase text-amber-500/70 font-semibold mb-2 mt-2 pt-4 border-t border-stone-800/40">
                  {subLabel}
                </div>
              )}
              <div
                className={`flex items-start justify-between gap-4 ${
                  item.is_featured ? "bg-amber-500/5 -mx-3 px-3 py-2 rounded-lg border border-amber-500/20" : ""
                }`}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={`text-base sm:text-lg ${item.is_featured ? "text-amber-300 font-semibold" : "text-stone-200"}`}>
                    {item.name}
                  </span>
                  {item.description && (
                    <RichText html={item.description} className={`text-sm mt-0.5 ${isWine ? "text-stone-500 italic" : "text-stone-400"}`} />
                  )}
                </div>
                {price > 0 && (
                  <span className={`text-base sm:text-lg font-light tabular-nums whitespace-nowrap pt-0.5 ${item.is_featured ? "text-amber-300" : "text-stone-300"}`}>
                    {formatPrice(price)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {category.children.map((child) => (
        <Category key={child.id} category={child} depth={depth + 1} />
      ))}
    </section>
  );
}

export default function MenuSection({ categories }: { categories: CategoryWithItems[] }) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <Category key={category.id} category={category} depth={0} />
      ))}
    </div>
  );
}
