import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/cms";
import RichText from "@/components/RichText";
import { MapPin, Phone, Mail, Instagram, Clock } from "lucide-react";
import { CONTACTS_KEY, mapsLink, parseContacts } from "@/lib/contacts";

export const Route = createFileRoute("/contatti")({
  head: () => ({
    meta: [
      { title: "Contatti — Trattoria da Giannino est. 1974" },
      { name: "description", content: "Via Nazionale 34, Santo Stefano di Camastra (ME). Tel. 0921 995719." },
      { property: "og:title", content: "Contatti — Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "Vieni a trovarci a Santo Stefano di Camastra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contatti,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-lg bg-stone-900/50 border border-stone-800/60 min-w-0 break-words">
      <h3 className="text-lg font-serif text-amber-400 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Contatti() {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const intro = settings?.["contatti_content"];
  const contacts = parseContacts(settings?.[CONTACTS_KEY]);
  const maps = mapsLink(contacts.mapAddress);
  const browserKey = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
  const mapUrl = browserKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(browserKey)}&q=${encodeURIComponent(contacts.mapAddress)}&language=it`
    : `https://www.google.com/maps?q=${encodeURIComponent(contacts.mapAddress)}&output=embed&hl=it`;
  const instagram = contacts.instagram.replace(/^@/, "").trim();
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
        <div className={`grid grid-cols-1 ${contacts.mapVisible ? "md:grid-cols-2" : ""} gap-8`}>
          <div className="space-y-6">
            {contacts.addressVisible && <Card title="Dove siamo">
              <a href={maps} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-stone-300 hover:text-amber-400 transition-colors group">
                <MapPin className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
                <RichText html={contacts.address} className="min-w-0 group-hover:underline" />
              </a>
            </Card>}
            {contacts.phoneVisible && <Card title="Telefono">
              <a href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 text-stone-300 hover:text-amber-400 transition-colors">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                {contacts.phone}
              </a>
            </Card>}
            {contacts.emailVisible && <Card title="Email">
              <a href={`mailto:${contacts.email}`} className="flex items-start gap-3 text-stone-300 hover:text-amber-400 transition-colors">
                <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="min-w-0 break-all">{contacts.email}</span>
              </a>
            </Card>}
            {contacts.instagramVisible && <Card title="Instagram">
              <a href={`https://www.instagram.com/${encodeURIComponent(instagram)}/`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-stone-300 hover:text-amber-400 transition-colors">
                <Instagram className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="min-w-0 break-all">@{instagram}</span>
              </a>
            </Card>}
            {contacts.hoursVisible && <Card title="Orari">
              <div className="flex items-start gap-3 text-stone-300">
                <Clock className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
                 <RichText html={contacts.hours} className="min-w-0" />
              </div>
            </Card>}
          </div>

          {contacts.mapVisible && <div className="rounded-lg overflow-hidden border border-site-border bg-site-panel flex flex-col min-w-0">
            {mapUrl ? <iframe
              title="Mappa Trattoria da Giannino est. 1974"
              src={mapUrl}
              width="100%"
              height="100%"
              className="border-0 min-h-[400px] flex-1"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            /> : <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 p-6 text-site-muted"><MapPin /><p>Google Maps non ancora collegato.</p></div>}
            <div className="bg-stone-900 px-4 py-3 text-right">
              <a href={maps} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Apri il percorso su Google Maps
              </a>
            </div>
          </div>}
        </div>
      </section>
    </div>
  );
}
