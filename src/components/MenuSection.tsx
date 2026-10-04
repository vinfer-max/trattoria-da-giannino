import type { CategoryWithItems } from "@/lib/menu";

function formatPrice(price: number): string {
  if (price === 0) return "";
  return `€${Number(price).toFixed(2).replace(".00", "")}`;
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

export default function MenuSection({ categories }: { categories: CategoryWithItems[] }) {
  return (
    <div className="space-y-12">
      {categories.map((category) => {
        const isWine = WINE_SLUGS.includes(category.slug);
        const isCocktails = category.slug === COCKTAILS_SLUG;
        const cover = Number(category.cover_charge ?? 0);

        return (
          <section key={category.id} id={category.slug} className="scroll-mt-24">
            <div className="flex items-baseline justify-between mb-6 border-b border-stone-700/50 pb-3">
              <h2 className="text-2xl sm:text-3xl font-serif text-amber-400">{category.name}</h2>
              {category.time_range && (
                <span className="text-sm text-stone-400 tracking-wide">{category.time_range}</span>
              )}
            </div>

            {cover > 0 && (
              <p className="text-sm text-stone-400 mb-4 italic">
                Coperto: €{cover.toFixed(2).replace(".00", "")}
              </p>
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
                      <div className="text-xs tracking-[0.2em] uppercase text-amber-500/70 font-semibold mb-2 mt-2 pt-4 border-t border-stone-800/40 first:mt-0 first:pt-0 first:border-t-0">
                        {subLabel}
                      </div>
                    )}
                    <div
                      className={`flex items-start justify-between gap-4 group ${
                        item.is_featured ? "bg-amber-500/5 -mx-3 px-3 py-2 rounded-lg border border-amber-500/20" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-base sm:text-lg ${
                            item.is_featured ? "text-amber-300 font-semibold" : "text-stone-200"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.description && !isWine && (
                          <p className="text-sm text-stone-400 mt-0.5">{item.description}</p>
                        )}
                        {item.description && isWine && (
                          <p className="text-sm text-stone-500 italic mt-0.5">{item.description}</p>
                        )}
                      </div>
                      {price > 0 && (
                        <span
                          className={`text-base sm:text-lg font-light tabular-nums whitespace-nowrap pt-0.5 ${
                            item.is_featured ? "text-amber-300" : "text-stone-300"
                          }`}
                        >
                          {formatPrice(price)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
