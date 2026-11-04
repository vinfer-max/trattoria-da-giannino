import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, CalendarDays } from "lucide-react";
import heroAsset from "@/assets/hero-sala.jpg.asset.json";
import { getHomeData } from "@/lib/cms";
import RichText from "@/components/RichText";

const fallbackHero = heroAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trattoria da Giannino est. 1974" },
      { name: "description", content: "Stesse radici, nuovo orizzonte. Colazione, brunch, pranzo, lounge e aperitivi a Santo Stefano di Camastra." },
      { property: "og:title", content: "Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "Stesse radici, nuovo orizzonte. Accanto alla tradizione, nasce un nuovo gusto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data } = useQuery({ queryKey: ["home"], queryFn: getHomeData });
  const s = data?.settings ?? {};
  const images = data && data.slides.length ? data.slides.map((x) => x.image_url) : [fallbackHero];
  const carousel = s['home_carousel_enabled'] === "true" && images.length > 1;
  const interval = Math.max(2, Number(s['home_carousel_interval']) || 5) * 1000;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!carousel) return setIdx(0);
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [carousel, interval, images.length]);

  return (
    <div>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {images.map((src, i) => (
          <div key={src + i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url("${src}")` }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/50 to-stone-950" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
          <span className="inline-block mb-6 text-xs sm:text-sm tracking-[0.3em] uppercase text-amber-500/80 font-medium">
            {s['home_eyebrow'] ?? "Est. 1974"}
          </span>
          {s['home_title'] ? (
            <RichText html={s['home_title']} className="text-4xl sm:text-6xl md:text-7xl font-serif text-stone-50 leading-[1.1] mb-6" />
          ) : (
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-stone-50 leading-[1.1] mb-6">
              Stesse radici,<br /><em className="text-amber-400">nuovo orizzonte.</em>
            </h1>
          )}
          <RichText html={s['home_subtitle'] ?? "Accanto alla tradizione, nasce un nuovo gusto."} className="text-lg sm:text-xl text-stone-300 font-light max-w-2xl mx-auto mb-10" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu" className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm tracking-wide rounded-lg">
              Scopri il Menù
            </Link>
            <Link to="/contatti" className="inline-flex items-center justify-center px-8 py-3.5 border border-stone-600 hover:border-amber-500/50 text-stone-200 hover:text-amber-400 font-medium text-sm rounded-lg">
              Contattaci
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-amber-500/60" />
        </div>
      </section>

      {data?.sections.map((sec, i) => (
        <section key={sec.id} className={`py-16 sm:py-24 ${i % 2 ? "bg-stone-900/30" : "bg-stone-950"}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {sec.title && <h2 className="text-xs sm:text-sm tracking-[0.3em] uppercase text-amber-500/80 font-medium text-center mb-6">{sec.title}</h2>}
            <RichText html={sec.content} className="text-stone-300 text-base sm:text-lg leading-[1.8]" />
          </div>
        </section>
      ))}

      {data && data.events.length > 0 && (
        <section className="py-16 sm:py-24 bg-stone-950 border-t border-stone-800/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 text-center mb-10">Eventi</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {data.events.map((e) => (
                <article key={e.id} className="rounded-xl bg-stone-900/50 border border-stone-800/60 overflow-hidden">
                  {e.image_url && <img src={e.image_url} alt={e.title} className="w-full aspect-[16/9] object-cover" loading="lazy" />}
                  <div className="p-5">
                    {e.event_date && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(e.event_date + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                    <h3 className="font-serif text-xl text-stone-100 mb-2">{e.title}</h3>
                    <RichText html={e.description} className="text-stone-400 text-sm" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
