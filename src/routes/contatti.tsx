import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/cms";
import RichText from "@/components/RichText";
import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";

const MAPS = "https://maps.google.com/?q=Via+Nazionale+34+98077+Santo+Stefano+di+Camastra+ME";

export const Route = createFileRoute("/contatti")({
  head: () => ({
    meta: [
      { title: "Contatti — Giannino Bistrot Cafè" },
      { name: "description", content: "Via Nazionale 34, Santo Stefano di Camastra (ME). Tel. 0921 995719." },
      { property: "og:title", content: "Contatti — Giannino Bistrot Cafè" },
      { property: "og:description", content: "Vieni a trovarci a Santo Stefano di Camastra." },
    ],
  }),
  component: Contatti,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-xl bg-stone-900/50 border border-stone-800/60">
      <h3 className="text-lg font-serif text-amber-400 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Contatti() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const intro = settings?.["contatti_content"];
  return (
    <div className="pt-20 sm:pt-24">
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MapPin className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-100 mb-3">Contatti</h1>
          <p className="text-stone-400 text-lg">Vieni a trovarci</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {intro && <RichText html={intro} className="mb-10 text-stone-300" />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card title="Dove siamo">
              <a href={MAPS} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-stone-300 hover:text-amber-400 transition-colors group">
                <MapPin className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
                <span className="group-hover:underline">
                  Via Nazionale, 34<br />98077 Santo Stefano di Camastra (ME)
                </span>
              </a>
            </Card>
            <Card title="Telefono">
              <a href="tel:0921995719" className="flex items-center gap-3 text-stone-300 hover:text-amber-400 transition-colors">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                0921 995719
              </a>
            </Card>
            <Card title="Email">
              <a href="mailto:gianninobistrotcafe@gmail.com" className="flex items-center gap-3 text-stone-300 hover:text-amber-400 transition-colors">
                <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                gianninobistrotcafe@gmail.com
              </a>
            </Card>
            <Card title="Instagram">
              <a href="https://instagram.com/giannino.bistrot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-stone-300 hover:text-amber-400 transition-colors">
                <Instagram className="w-5 h-5 text-amber-500 shrink-0" />
                @giannino.bistrot
              </a>
            </Card>
            <Card title="Orari">
              <div className="flex items-start gap-3 text-stone-300">
                <Clock className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
                <div>
                  <p>Lunedì – Domenica</p>
                  <p className="text-stone-400 text-sm mt-1">Giovedì chiuso</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="rounded-xl overflow-hidden border border-stone-800/60 h-[400px] md:h-auto bg-stone-900">
            <iframe
              title="Mappa Giannino Bistrot Cafè"
              src="https://www.openstreetmap.org/export/embed.html?bbox=14.5250%2C38.0100%2C14.5410%2C38.0235&layer=mapnik&marker=38.0167%2C14.5333"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              loading="lazy"
            />
            <div className="bg-stone-900 px-4 py-3 text-right">
              <a href={MAPS} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Apri il percorso su Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
