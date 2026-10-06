import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Trash2, LogOut, ArrowUp, ArrowDown, Eye, EyeOff, Save, ImagePlus, ChevronRight } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { getSettings, saveSetting, slugify, uploadImage, type SitePage, type HomeSlide, type HomeSection, type SiteEvent } from "@/lib/cms";
import RichEditor from "@/components/RichEditor";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Giannino Bistrot Cafè" },
      { name: "description", content: "Gestione menù e contenuti." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Giannino Bistrot Cafè" },
      { property: "og:description", content: "Gestione menù e contenuti." },
    ],
  }),
  component: AdminGate,
});

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
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  await Promise.all(arr.map((r, i) => db(table).update({ sort_order: i + 1 }).eq("id", r.id)));
}

function Controls({ table, list, idx, visible, onDone, onDelete }: {
  table: string; list: Sortable[]; idx: number; visible: boolean; onDone: () => void; onDelete?: () => void;
}) {
  const row = list[idx];
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

function AdminGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(false);
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="pt-20 sm:pt-24">
      <section className="py-10 text-center">
        <Shield className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-4xl font-serif text-stone-100">Admin</h1>
      </section>
      <section className="max-w-5xl mx-auto px-3 sm:px-6 pb-20">
        {!ready ? <p className="text-center text-stone-400">Caricamento…</p>
          : !session ? <LoginForm />
          : !isAdmin ? (
            <div className="text-center text-stone-400 space-y-4">
              <p>Il tuo account non ha i permessi di amministratore.</p>
              <button onClick={() => supabase.auth.signOut()} className="text-amber-400 underline">Esci</button>
            </div>
          ) : <AdminPanel />}
      </section>
    </div>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (res.error) setMsg(res.error.message);
    else if (mode === "up" && !res.data.session) setMsg("Controlla la tua email per confermare l'account.");
  }

  return (
    <form onSubmit={submit} className={`max-w-sm mx-auto space-y-3 p-6 ${card}`}>
      <input className={`${inputCls} w-full`} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className={`${inputCls} w-full`} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      {msg && <p className="text-sm text-amber-300">{msg}</p>}
      <button disabled={busy} className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg disabled:opacity-50">
        {mode === "in" ? "Accedi" : "Registrati"}
      </button>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-stone-400 hover:text-amber-400">
        {mode === "in" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
      </button>
    </form>
  );
}

const TABS = ["Pagine", "Categorie e Prodotti", "Home", "Eventi"] as const;

function AdminPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pagine");
  const qc = useQueryClient();
  useEffect(() => () => { qc.invalidateQueries(); }, [qc]);
  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400">
          <LogOut className="w-3.5 h-3.5" /> Esci
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); qc.invalidateQueries(); }}
            className={`px-4 py-2 text-sm rounded-lg ${tab === t ? "bg-amber-500 text-stone-950 font-semibold" : "bg-stone-800 text-stone-300 hover:bg-stone-700"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "Pagine" && <PagesTab />}
      {tab === "Categorie e Prodotti" && <CatalogTab />}
      {tab === "Home" && <HomeTab />}
      {tab === "Eventi" && <EventsTab />}
    </>
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
  return <input type={type} className={`${inputCls} ${className}`} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} />;
}

/* ---------------- Pagine ---------------- */
function PagesTab() {
  const [pages, load] = useList<SitePage>("site_pages");
  const [title, setTitle] = useState("");
  async function add() {
    const t = title.trim(); if (!t) return;
    const { error } = await db("site_pages").insert({ title: t, slug: slugify(t), sort_order: pages.length + 1 });
    if (error) alert(error.message);
    setTitle(""); load();
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-400">Le pagine visibili compaiono nel menu di navigazione, nell'ordine scelto. Le modifiche ai campi si salvano uscendo dal campo.</p>
      <div className="flex gap-2">
        <input className={`${inputCls} flex-1`} placeholder="Titolo nuova pagina" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className={addBtn} onClick={add}><Plus className="w-3.5 h-3.5" /> Pagina</button>
      </div>
      {pages.map((p, i) => (
        <div key={p.id} className={`${card} p-4 flex flex-col sm:flex-row gap-2 sm:items-center`}>
          <Field className="flex-1" value={p.title} onSave={(v) => db("site_pages").update({ title: v }).eq("id", p.id).then(load)} />
          <Field className="flex-1" placeholder="Sottotitolo" value={p.subtitle ?? ""} onSave={(v) => db("site_pages").update({ subtitle: v }).eq("id", p.id).then(load)} />
          <span className="text-xs text-stone-500">/{p.is_system ? p.slug : `p/${p.slug}`}</span>
          <Controls table="site_pages" list={pages} idx={i} visible={p.is_visible} onDone={load}
            onDelete={p.is_system ? undefined : async () => {
              await db("menu_categories").delete().eq("page", p.slug).not("parent_id", "is", null);
              const { data: cats } = await db("menu_categories").select("id").eq("page", p.slug);
              const ids = (cats ?? []).map((c: { id: string }) => c.id);
              if (ids.length) { await db("menu_items").delete().in("category_id", ids); await db("menu_categories").delete().in("id", ids); }
              await db("site_pages").delete().eq("id", p.id); load();
            }} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Categorie e prodotti ---------------- */
function CatalogTab() {
  const [pages] = useList<SitePage>("site_pages");
  const [page, setPage] = useState("menu");
  const [cats, loadCats] = useList<MenuCategory>("menu_categories", (q) => q.eq("page", page), [page]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const loadItems = async () => {
    const ids = cats.map((c) => c.id);
    if (!ids.length) return setItems([]);
    const { data } = await supabase.from("menu_items").select("*").in("category_id", ids).order("sort_order");
    setItems(data ?? []);
  };
  useEffect(() => { loadItems(); }, [cats]);
  const reload = () => { loadCats(); };
  const [newCat, setNewCat] = useState("");

  async function addCat(parent: string | null, name: string) {
    const siblings = cats.filter((c) => c.parent_id === parent);
    const { error } = await supabase.from("menu_categories").insert({ name, slug: `${slugify(name)}-${Date.now().toString(36)}`, page, parent_id: parent, sort_order: siblings.length + 1 });
    if (error) alert(error.message);
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-stone-400">Pagina:</span>
        <select className={inputCls} value={page} onChange={(e) => setPage(e.target.value)}>
          {pages.map((p) => <option key={p.id} value={p.slug}>{p.title}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <input className={`${inputCls} flex-1`} placeholder="Nuova categoria" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
        <button className={addBtn} onClick={() => { if (newCat.trim()) { addCat(null, newCat.trim()); setNewCat(""); } }}><Plus className="w-3.5 h-3.5" /> Categoria</button>
      </div>
      <CatList parent={null} depth={0} cats={cats} items={items} allCats={cats} reload={reload} reloadItems={loadItems} addCat={addCat} />
      {cats.length === 0 && <p className="text-center text-stone-500 italic">Nessuna categoria su questa pagina.</p>}
    </div>
  );
}

function CatList(props: { parent: string | null; depth: number; cats: MenuCategory[]; allCats: MenuCategory[]; items: MenuItem[]; reload: () => void; reloadItems: () => void; addCat: (p: string | null, n: string) => void }) {
  const list = props.cats.filter((c) => c.parent_id === props.parent);
  return <div className="space-y-4">{list.map((c, i) => <CatCard key={c.id} cat={c} idx={i} list={list} {...props} />)}</div>;
}

function CatCard({ cat, idx, list, depth, ...p }: { cat: MenuCategory; idx: number; list: MenuCategory[] } & Parameters<typeof CatList>[0]) {
  const [open, setOpen] = useState(true);
  const catItems = p.items.filter((i) => i.category_id === cat.id);
  const upd = (patch: Partial<MenuCategory>) => supabase.from("menu_categories").update(patch).eq("id", cat.id).then(p.reload);
  async function del() {
    const ids = [cat.id];
    for (let k = 0; k < ids.length; k++) p.allCats.filter((c) => c.parent_id === ids[k]).forEach((c) => ids.push(c.id));
    await supabase.from("menu_items").delete().in("category_id", ids);
    for (const id of [...ids].reverse()) await supabase.from("menu_categories").delete().eq("id", id);
    p.reload();
  }
  async function addItem() {
    await supabase.from("menu_items").insert({ category_id: cat.id, name: "Nuovo prodotto", price: 0, sort_order: catItems.length + 1 });
    p.reloadItems();
  }
  return (
    <div className={`${card} ${depth ? "ml-3 sm:ml-6" : ""} overflow-hidden`}>
      <div className="p-3 bg-stone-800/30 flex flex-wrap gap-2 items-center">
        <button onClick={() => setOpen(!open)} className={btn}><ChevronRight className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`} /></button>
        <Field className="flex-1 min-w-[140px] font-serif text-amber-400" value={cat.name} onSave={(v) => upd({ name: v })} />
        <Field className="w-32" placeholder="Orario" value={cat.time_range ?? ""} onSave={(v) => upd({ time_range: v })} />
        <Field className="w-24" type="number" placeholder="Coperto €" value={String(cat.cover_charge ?? 0)} onSave={(v) => upd({ cover_charge: parseFloat(v) || 0 })} />
        <Controls table="menu_categories" list={list} idx={idx} visible={cat.is_visible} onDone={p.reload} onDelete={del} />
      </div>
      {open && (
        <div className="p-3 space-y-3">
          {catItems.map((it, i) => <ItemRow key={it.id} item={it} idx={i} list={catItems} cats={p.allCats} reload={p.reloadItems} />)}
          {catItems.length === 0 && <p className="text-sm text-stone-500 italic">Nessun prodotto</p>}
          <div className="flex flex-wrap gap-2">
            <button className={addBtn} onClick={addItem}><Plus className="w-3.5 h-3.5" /> Prodotto</button>
            <button className={addBtn} onClick={() => { const n = prompt("Nome sottocategoria"); if (n?.trim()) p.addCat(cat.id, n.trim()); }}><Plus className="w-3.5 h-3.5" /> Sottocategoria</button>
          </div>
          <CatList {...p} parent={cat.id} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, idx, list, cats, reload }: { item: MenuItem; idx: number; list: MenuItem[]; cats: MenuCategory[]; reload: () => void }) {
  const upd = (patch: Partial<MenuItem>) => supabase.from("menu_items").update(patch).eq("id", item.id).then(reload);
  return (
    <div className="rounded-lg border border-stone-800 p-3 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <Field className="flex-1 min-w-[140px]" value={item.name} onSave={(v) => upd({ name: v })} />
        <Field className="w-24" type="number" placeholder="Prezzo" value={String(item.price)} onSave={(v) => upd({ price: parseFloat(v) || 0 })} />
        <Controls table="menu_items" list={list} idx={idx} visible={item.is_visible} onDone={reload}
          onDelete={() => supabase.from("menu_items").delete().eq("id", item.id).then(reload)} />
      </div>
      <Field className="w-full" placeholder="Descrizione" value={item.description ?? ""} onSave={(v) => upd({ description: v })} />
      <div className="flex flex-wrap gap-3 items-center text-xs text-stone-400">
        <label className="flex items-center gap-1"><input type="checkbox" checked={!!item.is_featured} onChange={(e) => upd({ is_featured: e.target.checked })} /> In evidenza</label>
        <label className="flex items-center gap-1">Sposta in:
          <select className={`${inputCls} py-1`} value={item.category_id} onChange={(e) => upd({ category_id: e.target.value })}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <ImagePicker url={item.image_url ?? ""} folder="products" onChange={(u) => upd({ image_url: u })} />
      </div>
    </div>
  );
}

/* ---------------- Home ---------------- */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div className={`${card} p-4 space-y-4`}><h2 className="font-serif text-xl text-amber-400">{title}</h2>{children}</div>;
}

function HomeTab() {
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
          <input className={`${inputCls} w-full mt-1`} value={settings.home_eyebrow ?? ""} onChange={(e) => set("home_eyebrow", e.target.value)} />
        </label>
        <div className="text-xs text-stone-400">Titolo<RichEditor value={settings.home_title ?? ""} onChange={(v) => set("home_title", v)} /></div>
        <div className="text-xs text-stone-400">Sottotitolo<RichEditor value={settings.home_subtitle ?? ""} onChange={(v) => set("home_subtitle", v)} /></div>
        <div className="flex flex-wrap gap-4 items-center text-sm text-stone-300">
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.home_carousel_enabled === "true"} onChange={(e) => set("home_carousel_enabled", String(e.target.checked))} /> Carosello immagini attivo</label>
          <label className="flex items-center gap-2">Secondi per immagine
            <input type="number" min={2} className={`${inputCls} w-20`} value={settings.home_carousel_interval ?? "5"} onChange={(e) => set("home_carousel_interval", e.target.value)} />
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
function EventsTab() {
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
