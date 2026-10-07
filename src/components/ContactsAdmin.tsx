import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import RichEditor from "@/components/RichEditor";
import { getSettings, saveSetting } from "@/lib/cms";
import { CONTACTS_KEY, parseContacts, type ContactDetails } from "@/lib/contacts";

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState<ContactDetails | null>(null);
  const [intro, setIntro] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const qc = useQueryClient();
  useEffect(() => {
    getSettings().then((settings) => {
      setContacts(parseContacts(settings[CONTACTS_KEY]));
      setIntro(settings['contatti_content'] ?? "");
    }).catch(() => setMessage("Impossibile caricare i contatti. Riprova."));
  }, []);

  function update<K extends keyof ContactDetails>(key: K, value: ContactDetails[K]) {
    setContacts((current) => current ? { ...current, [key]: value } : current);
  }

  async function save() {
    if (!contacts) return;
    setBusy(true); setMessage("");
    try {
      await saveSetting(CONTACTS_KEY, JSON.stringify(contacts));
      await saveSetting("contatti_content", intro);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      setMessage("Contatti salvati!");
    } catch { setMessage("Salvataggio non riuscito. Le modifiche non sono state salvate: riprova."); }
    finally { setBusy(false); }
  }

  if (!contacts) return <p role="status">{message || "Caricamento…"}</p>;
  const fields = [
    { key: "address", visibility: "addressVisible", label: "Dove siamo", rich: true },
    { key: "phone", visibility: "phoneVisible", label: "Telefono", type: "tel" },
    { key: "email", visibility: "emailVisible", label: "Email", type: "email" },
    { key: "instagram", visibility: "instagramVisible", label: "Instagram", type: "text" },
    { key: "hours", visibility: "hoursVisible", label: "Orari", rich: true },
    { key: "mapAddress", visibility: "mapVisible", label: "Indirizzo su Google Maps", type: "text" },
  ] as const;
  return (
    <form className="space-y-8 text-site-text" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <section className="space-y-3">
        <h2 className="font-serif text-xl text-site-accent">Testo introduttivo</h2>
        <RichEditor value={intro} onChange={setIntro} />
      </section>
      {fields.map((field) => (
        <section key={field.key} className="space-y-3 border-t border-site-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor={`contact-${field.key}`} className="font-serif text-xl text-site-accent">{field.label}</label>
            <label className="flex items-center gap-2 text-sm text-site-muted">
              <input type="checkbox" checked={contacts[field.visibility]} onChange={(event) => update(field.visibility, event.target.checked)} /> Visibile
            </label>
          </div>
          {"rich" in field ? <RichEditor value={contacts[field.key]} onChange={(value) => update(field.key, value)} /> : (
            <input id={`contact-${field.key}`} aria-label={field.label} type={field.type} className="w-full min-w-0 rounded border border-site-border bg-site-panel px-3 py-2 text-sm text-site-text" value={contacts[field.key]} onChange={(event) => update(field.key, event.target.value)} />
          )}
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy} className="bg-site-accent text-site-bg hover:bg-site-accent/90"><Save />{busy ? "Salvataggio…" : "Salva contatti"}</Button>
        <p role="status" className="text-sm text-site-muted">{message}</p>
      </div>
    </form>
  );
}