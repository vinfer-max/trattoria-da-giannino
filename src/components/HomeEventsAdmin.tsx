import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Save, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSettings, saveSetting, uploadImage, type HomeSlide, type HomeSection, type SiteEvent } from "@/lib/cms";
import RichEditor from "@/components/RichEditor";

const inputCls = "bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm text-stone-100";
const btn = "p-1.5 rounded text-stone-400 hover:text-amber-400 hover:bg-stone-700 disabled:opacity-30";
const addBtn = "inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg";
const card = "rounded-xl bg-stone-900/50 border border-stone-800/60";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (t: string) => supabase.from(t as any) as any;

type Sortable = { id: string; sort_order: number | null };

/** Swaps sort order with the neighbour and renumbers the whole list. */
async function move(table: string, list: Sortable[], idx: number, dir: -1 | 1) {
  const j = idx + dir;
  if (j < 0 || j >= list.length) return;
  const arr = [...list];
  const tmp = arr[idx]!; arr[idx] = arr[j]!; arr[j] = tmp;
  await Promise.all(arr.map((r, i) => db(table).update({ sort_order: i + 1 }).eq("id", r.id)));
}

function Controls({ table, list, idx, visible, onDone, onDelete }: {
  table: string; list: Sortable[]; idx: number; visible: boolean; onDone: () => void; onDelete?: (() => void) | undefined;
}) {
  const row = list[idx]!;
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button className={btn} title="Su" disabled={idx === 0} onClick={() => move(table, list, idx, -1).then(onDone)}><ArrowUp className="w-4 h-4" /></button>
      <button className={btn} title="Giù" disabled={idx === list.length - 1} onClick={() => move(table, list, idx, 1).then(onDone)}><ArrowDown className="w-4 h-4" /></button>
      <button className={btn} title={visible ? "Nascondi" : "Mostra"} onClick={() => db(table).update({ is_visible: !visible }).eq("id", row.id).then(onDone)}>
        {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-red-400" />}
      </button>
      {onDelete && (
        <button className={btn} title="Elimina" onClick={() => confirm("Eliminare definitivamente?") && onDelete()}><Trash2 className="w-4 h-4" /></button>
      )}
    </div>
  );
}

function ImagePicker({ url, folder, onChange }: { url: string; folder: string; onChange: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {url && <img src={url} alt="" className="w-12 h-12 object-cover rounded" />}
      <label className={`${addBtn} cursor-pointer`}>
        <ImagePlus className="w-3.5 h-3.5" /> {busy ? "Caricamento…" : url ? "Cambia foto" : "Foto"}
        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true);
          try { onChange(await uploadImage(f, folder)); } catch (err) { alert((err as Error).message); }
          setBusy(false);
        }} />
      </label>
      {url && <button className="text-xs text-red-400" onClick={() => onChange("")}>Rimuovi</button>}
    </div>
  );
}


function useList<T>(table: string, filter?: (q: any) => any, deps: unknown[] = []) {
  const [rows, setRows] = useState<T[]>([]);
  const load = async () => {
    let q = db(table).select("*");
    if (filter) q = filter(q);
    const { data } = await q.order("sort_order");
    setRows((data as T[]) ?? []);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, deps);
  return [rows, load] as const;
}

function Field({ value, onSave, className = "", placeholder, type = "text" }: { value: string; onSave: (v: string) => void; className?: string; placeholder?: string; type?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return <input type={type} className={`${inputCls} ${className}`} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />;
}

/* ---------------- Home ---------------- */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div className={`${card} p-4 space-y-4`}><h2 className="font-serif text-xl text-amber-400">{title}</h2>{children}</div>;
}

export function HomeTab() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [slides, loadSlides] = useList<HomeSlide>("home_slides");
  const [sections, loadSections] = useList<HomeSection>("home_sections");
  useEffect(() => { getSettings().then(setSettings); }, []);
  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }));
  const [saved, setSaved] = useState(false);

  if (!settings) return <p className="text-stone-400">Caricamento…</p>;
  async function saveTexts() {
    for (const k of ["home_eyebrow", "home_title", "home_subtitle", "home_carousel_enabled", "home_carousel_interval"]) await saveSetting(k, settings![k] ?? "");
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Section title="Testata">
        <label className="block text-xs text-stone-400">Scritta piccola in alto
          <input className={`${inputCls} w-full mt-1`} value={settings['home_eyebrow'] ?? ""} onChange={(e) => set("home_eyebrow", e.target.value)} />
        </label>
        <div className="text-xs text-stone-400">Titolo<RichEditor value={settings['home_title'] ?? ""} onChange={(v) => set("home_title", v)} /></div>
        <div className="text-xs text-stone-400">Sottotitolo<RichEditor value={settings['home_subtitle'] ?? ""} onChange={(v) => set("home_subtitle", v)} /></div>
        <div className="flex flex-wrap gap-4 items-center text-sm text-stone-300">
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings['home_carousel_enabled'] === "true"} onChange={(e) => set("home_carousel_enabled", String(e.target.checked))} /> Carosello immagini attivo</label>
          <label className="flex items-center gap-2">Secondi per immagine
            <input type="number" min={2} className={`${inputCls} w-20`} value={settings['home_carousel_interval'] ?? "5"} onChange={(e) => set("home_carousel_interval", e.target.value)} />
          </label>
        </div>
        <button onClick={saveTexts} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-stone-950 font-semibold rounded-lg"><Save className="w-4 h-4" /> {saved ? "Salvato!" : "Salva testata"}</button>
      </Section>

      <Section title="Immagini della testata">
        <p className="text-xs text-stone-400">Con il carosello spento viene mostrata solo la prima immagine visibile.</p>
        {slides.map((s, i) => (
          <div key={s.id} className="flex flex-wrap gap-2 items-center">
            <img src={s.image_url} alt="" className="w-24 h-16 object-cover rounded" />
            <Field className="flex-1" placeholder="Descrizione immagine" value={s.alt ?? ""} onSave={(v) => db("home_slides").update({ alt: v }).eq("id", s.id).then(loadSlides)} />
            <Controls table="home_slides" list={slides} idx={i} visible={s.is_visible} onDone={loadSlides} onDelete={() => db("home_slides").delete().eq("id", s.id).then(loadSlides)} />
          </div>
        ))}
        <ImagePicker url="" folder="home" onChange={(u) => u && db("home_slides").insert({ image_url: u, sort_order: slides.length + 1 }).then(loadSlides)} />
      </Section>

      <Section title="Sezioni di testo">
        {sections.map((s, i) => <SectionEditor key={s.id} s={s} idx={i} list={sections} reload={loadSections} />)}
        <button className={addBtn} onClick={() => db("home_sections").insert({ title: "Nuova sezione", content: "<p>Testo…</p>", sort_order: sections.length + 1 }).then(loadSections)}>
          <Plus className="w-3.5 h-3.5" /> Sezione
        </button>
      </Section>
    </div>
  );
}

function SectionEditor({ s, idx, list, reload }: { s: HomeSection; idx: number; list: HomeSection[]; reload: () => void }) {
  const [content, setContent] = useState(s.content);
  const [title, setTitle] = useState(s.title ?? "");
  return (
    <div className="rounded-lg border border-stone-800 p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <input className={`${inputCls} flex-1`} placeholder="Titolo sezione (opzionale)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Controls table="home_sections" list={list} idx={idx} visible={s.is_visible} onDone={reload} onDelete={() => db("home_sections").delete().eq("id", s.id).then(reload)} />
      </div>
      <RichEditor value={content} onChange={setContent} />
      <button className={addBtn} onClick={() => db("home_sections").update({ title, content }).eq("id", s.id).then(reload)}><Save className="w-3.5 h-3.5" /> Salva sezione</button>
    </div>
  );
}

/* ---------------- Eventi ---------------- */
export function EventsTab() {
  const [events, load] = useList<SiteEvent>("events");
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-400">Gli eventi visibili compaiono in home; quelli con data passata vengono nascosti automaticamente.</p>
      <button className={addBtn} onClick={() => db("events").insert({ title: "Nuovo evento", sort_order: events.length + 1 }).then(load)}><Plus className="w-3.5 h-3.5" /> Evento</button>
      {events.map((e, i) => <EventEditor key={e.id} e={e} idx={i} list={events} reload={load} />)}
    </div>
  );
}

function EventEditor({ e, idx, list, reload }: { e: SiteEvent; idx: number; list: SiteEvent[]; reload: () => void }) {
  const [f, setF] = useState({ title: e.title, event_date: e.event_date ?? "", description: e.description, image_url: e.image_url ?? "" });
  return (
    <div className={`${card} p-4 space-y-2`}>
      <div className="flex flex-wrap gap-2 items-center">
        <input className={`${inputCls} flex-1 min-w-[160px]`} value={f.title} onChange={(ev) => setF({ ...f, title: ev.target.value })} />
        <input type="date" className={inputCls} value={f.event_date} onChange={(ev) => setF({ ...f, event_date: ev.target.value })} />
        <Controls table="events" list={list} idx={idx} visible={e.is_visible} onDone={reload} onDelete={() => db("events").delete().eq("id", e.id).then(reload)} />
      </div>
      <RichEditor value={f.description} onChange={(v) => setF((x) => ({ ...x, description: v }))} />
      <div className="flex flex-wrap gap-3 items-center">
        <ImagePicker url={f.image_url} folder="events" onChange={(u) => setF({ ...f, image_url: u })} />
        <button className={addBtn} onClick={() => db("events").update({ ...f, event_date: f.event_date || null }).eq("id", e.id).then(reload)}><Save className="w-3.5 h-3.5" /> Salva evento</button>
      </div>
    </div>
  );
}

