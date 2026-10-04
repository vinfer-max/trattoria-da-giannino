import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import heroAsset from "@/assets/hero-sala.jpg.asset.json";

const hero = heroAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Giannino Bistrot Cafè — Est. 1974" },
      { name: "description", content: "Stesse radici, nuovo orizzonte. Colazione, brunch, pranzo, lounge e aperitivi a Santo Stefano di Camastra." },
      { property: "og:title", content: "Giannino Bistrot Cafè — Est. 1974" },
      { property: "og:description", content: "Stesse radici, nuovo orizzonte. Accanto alla tradizione, nasce un nuovo gusto." },
    ],
  }),
  component: Home,
});

function Home() {
  const [visible, setVisible] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1 },
    );
    storyRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url("${hero}")` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/50 to-stone-950" />
        </div>

        <div
          className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-all duration-1000 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="mb-6">
            <span className="inline-block text-xs sm:text-sm tracking-[0.3em] uppercase text-amber-500/80 font-medium">
              Est. 1974
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-stone-50 leading-[1.1] mb-6">
            Stesse radici,
            <br />
            <em className="text-amber-400">nuovo orizzonte.</em>
          </h1>
          <p className="text-lg sm:text-xl text-stone-300 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Accanto alla tradizione, nasce un nuovo gusto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm tracking-wide rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25"
            >
              Scopri il Menù
            </Link>
            <Link
              to="/contatti"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-stone-600 hover:border-amber-500/50 text-stone-200 hover:text-amber-400 font-medium text-sm tracking-wide rounded-lg transition-all duration-300"
            >
              Contattaci
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-amber-500/60" />
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-stone-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg sm:text-xl text-stone-200 leading-relaxed mb-6">
            C'è la Trattoria che conoscete da cinquant'anni, e da oggi c'è un nuovo posto dove incontrarsi.
          </p>
          <p className="text-lg sm:text-xl text-stone-200 leading-relaxed mb-8">
            Siamo orgogliosi di presentarvi il nostro Bistrot: il luogo dove la nostra storia dal 1974 incontra la contemporaneità.
          </p>
          <p className="text-base text-stone-400 leading-relaxed">
            Colazione, brunch, pranzo, lounge e aperitivi. Atmosfera curata, sapori ricercati e un'accoglienza che ti fa sentire sempre al posto giusto.
          </p>
        </div>
      </section>

      <section ref={storyRef} className="py-20 sm:py-28 bg-stone-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
                <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-amber-500/80 font-medium">
                  La Nostra Storia
                </span>
              </div>
              <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
                <p className="text-stone-300 leading-[1.8] text-base sm:text-lg">
                  Benvenuti a questa tavola di antiche radici, nate nel lontano 1974 dal garbo di Giannino e dal cuore di Maria. Qui, dove l'arte della ceramica incontra la passione per la buona cucina, la Musa dipinta sui nostri tavoli si fa custode dei nostri segreti e porta con grazia sul capo i simboli della nostra storia: il polpo, ricordo di Giannino giovanissimo pescatore; il pollo, protagonista dei sui celebri spiedi; le mani infarinate di Maria, pilastro della nostra cucina, che trasformava gesti semplici in riti immortali.
                </p>
              </div>
              <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
                <p className="text-stone-300 leading-[1.8] text-base sm:text-lg">
                  Da lei abbiamo imparato l'arte delle torte della nonna e la sapienza della storica salsa alla Giuseppina, una ricetta che profuma ancora oggi i nostri piatti di famiglia. Qui, tra i vecchi ricordi di sarde, pomodori e cannoli o tra le pennellate di verderame e ocra del nostro design, potete gustare, un boccone alla volta, l'evoluzione gentile della nostra cucina, cultura del gusto e simbolo d'ospitalità.
                </p>
              </div>
              <div className="reveal opacity-0 translate-y-8 transition-all duration-700 pt-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-amber-500/30" />
                  <p className="font-serif text-amber-400 text-xl italic">Elena e Mario</p>
                  <div className="h-px flex-1 bg-amber-500/30" />
                </div>
              </div>
            </div>

            <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <img src={hero} alt="Sala interna della Giannino Bistrot Cafè al tramonto" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
