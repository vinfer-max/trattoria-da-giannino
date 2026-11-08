import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Eye, EyeOff, Search, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { MenuCategory, MenuItem } from "@/lib/menu";
import { slugify, uploadImage, type SitePage } from "@/lib/cms";
import { formatPrice, parsePrice } from "@/lib/price";
import RichEditor from "@/components/RichEditor";
import ContactsAdmin from "@/components/ContactsAdmin";
import { HomeTab } from "@/components/HomeEventsAdmin";
import { PAGE_ICONS, PageIcon } from "@/lib/page-icons";
import { getSettings, saveSetting } from "@/lib/cms";
import { PRICE_COLOR_KEY } from "@/components/MenuSection";
import { SortableList } from "@/components/SortableList";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Pannello Admin — Trattoria da Giannino est. 1974" },
      { name: "description", content: "Gestisci catalogo e contenuti della Trattoria da Giannino." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Pannello Admin — Trattoria da Giannino est. 1974" },
      { property: "og:description", content: "Area riservata per la gestione della Trattoria da Giannino." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminGate,
});

const NONE = "__none__";
const strip = (s: string | null | undefined) => (s ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const cleanRich = (s: string) => (strip(s) ? s.trim() : "");

async function persistOrder(table: "menu_categories" | "menu_items" | "site_pages", ordered: { id: string }[]) {
  const res = await Promise.all(ordered.map((it, i) => supabase.from(table).update({ sort_order: i + 1 }).eq("id", it.id)));
  const err = res.find((r) => r.error)?.error;
  if (err) toast.error(err.message); else toast.success("Ordine salvato");
}

/* ---------------- Accesso ---------------- */
function AdminGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="pt-16 sm:pt-20 min-h-screen bg-background text-foreground">
      <Toaster />
      {!ready || (session && isAdmin === null) ? (
        <div className="px-6 py-12 text-muted-foreground">Caricamento…</div>
      ) : !session ? <LoginForm />
        : !isAdmin ? (
          <div className="px-6 py-20 max-w-xl mx-auto text-center space-y-4">
            <h1 className="font-serif text-3xl">Accesso non autorizzato</h1>
            <p className="text-muted-foreground">Il tuo account non ha i permessi di amministratore.</p>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>Esci</Button>
          </div>
        ) : <AdminPage />}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("Credenziali non valide");
  }
  return (
    <div className="px-6 py-16 max-w-sm mx-auto">
      <h1 className="font-serif text-3xl mb-2">Accesso Admin</h1>
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8">Area riservata</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Accesso…" : "Accedi"}</Button>
      </form>
      <Link to="/" className="block mt-6 text-sm text-muted-foreground hover:text-foreground">← Torna al sito</Link>
    </div>
  );
}

/* ---------------- Pannello ---------------- */
type Tab = "products" | "categories" | "sections" | "contacts" | "home";

function AdminPage() {
  const qc = useQueryClient();
  useEffect(() => () => { qc.invalidateQueries(); }, [qc]);
  const [pages, setPages] = useState<SitePage[]>([]);
  const [page, setPage] = useState("menu");
  const [tab, setTab] = useState<Tab>("products");
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadPages = useCallback(async () => {
    const { data } = await supabase.from("site_pages").select("*").order("sort_order");
    setPages(data ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setLoadingData(true);
    const { data: cats, error } = await supabase.from("menu_categories").select("*").eq("page", page)
      .order("sort_order").order("created_at");
    if (error) toast.error("Errore caricamento categorie");
    const ids = (cats ?? []).map((c) => c.id);
    const [inCats, direct] = await Promise.all([
      ids.length ? supabase.from("menu_items").select("*").in("category_id", ids).order("sort_order").order("created_at") : Promise.resolve({ data: [] as MenuItem[] }),
      supabase.from("menu_items").select("*").eq("page", page).is("category_id", null).order("sort_order").order("created_at"),
    ]);
    setCategories(cats ?? []);
    setProducts([...(direct.data ?? []), ...(inCats.data ?? [])]);
    setLoadingData(false);
  }, [page]);

  useEffect(() => { loadPages(); }, [loadPages]);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="px-4 md:px-12 py-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl">Pannello Admin</h1>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-1">Gestione catalogo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSearchOpen(true)} title="Cerca" aria-label="Cerca"><Search className="h-4 w-4" /></Button>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Sito</Link>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>Esci</Button>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} pages={pages}
        onJump={(pg, t) => { setPage(pg); setTab(t); setSearchOpen(false); }} />

      {(tab === "products" || tab === "categories") && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Label className="text-xs tracking-widest uppercase text-muted-foreground">Pagina</Label>
          <Select value={page} onValueChange={setPage}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pages.map((p) => <SelectItem key={p.id} value={p.slug}>{p.title}{p.is_visible ? "" : " (nascosta)"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="grid h-auto w-full max-w-xl grid-cols-3 sm:grid-cols-5 gap-1 [&>button]:min-w-0 [&>button]:py-2">
          <TabsTrigger value="products">Prodotti</TabsTrigger>
          <TabsTrigger value="categories">Categorie</TabsTrigger>
          <TabsTrigger value="sections">Pagine</TabsTrigger>
          <TabsTrigger value="contacts">Contatti</TabsTrigger>
          <TabsTrigger value="home">Home</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsManager page={page} categories={categories} products={products} loading={loadingData} onChange={refresh} />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoriesManager page={page} categories={categories} loading={loadingData} onChange={refresh} />
        </TabsContent>
        <TabsContent value="sections" className="mt-6">
          <PagesManager pages={pages} onChange={loadPages} />
        </TabsContent>
        <TabsContent value="contacts" className="mt-6"><DarkPanel><ContactsAdmin /></DarkPanel></TabsContent>
        <TabsContent value="home" className="mt-6"><DarkPanel><HomeTab /></DarkPanel></TabsContent>
      </Tabs>
    </div>
  );
}

function DarkPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-site-bg text-site-text p-4 sm:p-6">{children}</div>;
}

function RowActions({ visible, onToggle, onEdit, onDelete, deletable = true }: { visible: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void; deletable?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={onToggle} title={visible ? "Nascondi" : "Mostra"}>
        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={onEdit} title="Modifica"><Pencil className="h-4 w-4" /></Button>
      {deletable && <Button variant="ghost" size="icon" onClick={onDelete} title="Elimina"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
    </div>
  );
}

function ConfirmDelete({ open, title, description, onCancel, onConfirm }: { open: boolean; title: string; description: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Elimina</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------- Pagine ---------------- */
function PagesManager({ pages, onChange }: { pages: SitePage[]; onChange: () => void }) {
  const [editing, setEditing] = useState<SitePage | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<SitePage | null>(null);

  async function toggle(p: SitePage) {
    const { error } = await supabase.from("site_pages").update({ is_visible: !p.is_visible }).eq("id", p.id);
    if (error) toast.error(error.message);
    onChange();
  }
  async function doDelete() {
    const p = toDelete; if (!p) return;
    const { data: cats } = await supabase.from("menu_categories").select("id").eq("page", p.slug);
    const ids = (cats ?? []).map((c) => c.id);
    if (ids.length) await supabase.from("menu_items").delete().in("category_id", ids);
    await supabase.from("menu_items").delete().eq("page", p.slug);
    await supabase.from("menu_categories").delete().eq("page", p.slug).not("parent_id", "is", null);
    await supabase.from("menu_categories").delete().eq("page", p.slug);
    const { error } = await supabase.from("site_pages").delete().eq("id", p.id);
    if (error) toast.error(error.message); else toast.success("Pagina eliminata");
    setToDelete(null); onChange();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">Le pagine visibili compaiono nel menù del sito. Trascina per riordinarle.</p>
        <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Nuova pagina</Button>
      </div>
      <div className="border-y border-border">
        <SortableList items={pages} onReorder={async (next) => { await persistOrder("site_pages", next); onChange(); }}
          renderItem={(p) => (
            <div className="flex items-center justify-between gap-3 py-1 flex-1 min-w-0">
              <div className="text-amber-400 [&>svg]:h-5 [&>svg]:w-5 shrink-0"><PageIcon name={p.icon} fallback={<span className="text-xs text-muted-foreground">—</span>} /></div>
              <div className="min-w-0 flex-1">
                <p className={`font-serif text-lg ${p.is_visible ? "" : "text-muted-foreground line-through"}`}>{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.is_system ? `/${p.slug}` : `/p/${p.slug}`}{p.subtitle ? ` · ${strip(p.subtitle)}` : ""}</p>
              </div>
              <RowActions visible={p.is_visible} onToggle={() => toggle(p)} onEdit={() => setEditing(p)} onDelete={() => setToDelete(p)} deletable={!p.is_system} />
            </div>
          )} />
      </div>
      {(creating || editing) && (
        <PageDialog page={editing} count={pages.length}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); onChange(); }} />
      )}
      <ConfirmDelete open={!!toDelete} title={`Eliminare "${toDelete?.title}"?`}
        description="Verranno eliminate anche tutte le categorie e i prodotti di questa pagina. L'operazione non è reversibile."
        onCancel={() => setToDelete(null)} onConfirm={doDelete} />
    </div>
  );
}

function PageDialog({ page, count, onClose, onSaved }: { page: SitePage | null; count: number; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(page?.title ?? "");
  const [subtitle, setSubtitle] = useState(page?.subtitle ?? "");
  const [content, setContent] = useState(page?.content ?? "");
  const [icon, setIcon] = useState(page?.icon ?? "");
  const [visible, setVisible] = useState(page?.is_visible ?? true);
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!title.trim()) { toast.error("Inserisci un nome"); return; }
    const extra = { subtitle: cleanRich(subtitle) || null, content: cleanRich(content), icon };
    setSaving(true);
    const { error } = page
      ? await supabase.from("site_pages").update({ title: title.trim(), ...extra, is_visible: visible }).eq("id", page.id)
      : await supabase.from("site_pages").insert({ title: title.trim(), ...extra, is_visible: visible, slug: `${slugify(title) || "pagina"}-${Math.random().toString(36).slice(2, 6)}`, sort_order: count + 1 });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pagina salvata"); onSaved();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{page ? "Modifica pagina" : "Nuova pagina"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Simbolo</Label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
              <button type="button" onClick={() => setIcon("")} title="Nessuno"
                className={`h-10 rounded-md border text-xs ${icon === "" ? "border-amber-400 bg-amber-400/15 text-amber-300" : "border-border text-muted-foreground hover:border-amber-400/50"}`}>—</button>
              {Object.entries(PAGE_ICONS).map(([key, { label, Icon }]) => (
                <button key={key} type="button" onClick={() => setIcon(key)} title={label} aria-label={label}
                  className={`h-10 flex items-center justify-center rounded-md border ${icon === key ? "border-amber-400 bg-amber-400/15 text-amber-300" : "border-border text-foreground/80 hover:border-amber-400/50"}`}>
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2"><Label>Sottotitolo</Label><div className="rounded-md bg-site-bg p-1"><RichEditor value={subtitle} onChange={setSubtitle} /></div></div>
          <div className="space-y-2"><Label>Testo della pagina (es. "Chi siamo", storia, presentazione)</Label><div className="rounded-md bg-site-bg p-1"><RichEditor value={content} onChange={setContent} /></div></div>
          <div className="flex items-center gap-2"><Switch checked={visible} onCheckedChange={setVisible} id="vis-page" /><Label htmlFor="vis-page">Visibile</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvataggio…" : "Salva"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Categorie ---------------- */
function CategoriesManager({ page, categories, loading, onChange }: { page: string; categories: MenuCategory[]; loading: boolean; onChange: () => void }) {
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<MenuCategory | null>(null);

  async function toggle(c: MenuCategory) {
    const { error } = await supabase.from("menu_categories").update({ is_visible: !c.is_visible }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(c.is_visible ? "Categoria nascosta" : "Categoria visibile"); onChange();
  }
  async function doDelete(c: MenuCategory) {
    const ids = [c.id];
    for (let k = 0; k < ids.length; k++) categories.filter((x) => x.parent_id === ids[k]).forEach((x) => ids.push(x.id));
    await supabase.from("menu_items").delete().in("category_id", ids);
    for (const id of [...ids].reverse()) await supabase.from("menu_categories").delete().eq("id", id);
    toast.success("Categoria eliminata"); setToDelete(null); onChange();
  }

  const childrenOf = (id: string | null) => categories.filter((c) => c.parent_id === id);
  const reorder = async (items: MenuCategory[]) => { await persistOrder("menu_categories", items); onChange(); };

  const renderRow = (c: MenuCategory, isChild = false) => (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${c.is_visible ? "" : "text-muted-foreground line-through"}`}>{isChild && <span className="text-muted-foreground">↳ </span>}{c.name}</p>
        {(c.time_range || c.cover_charge) && <p className="text-xs text-muted-foreground">{c.time_range}{c.cover_charge ? ` · Coperto € ${formatPrice(c.cover_charge)}` : ""}</p>}
      </div>
      <RowActions visible={c.is_visible} onToggle={() => toggle(c)} onEdit={() => setEditing(c)} onDelete={() => setToDelete(c)} />
    </div>
  );

  const renderTree = (c: MenuCategory, depth: number): React.ReactNode => {
    const kids = childrenOf(c.id);
    return (
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {renderRow(c, depth > 0)}
        {kids.length > 0 && (
          <div className="ml-4 sm:ml-6 border-l border-border pl-3">
            <SortableList items={kids} onReorder={reorder} renderItem={(k) => renderTree(k, depth + 1)} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreating(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nuova categoria</Button>
      </div>
      {loading && categories.length === 0 ? <p className="text-muted-foreground">Caricamento…</p>
        : categories.length === 0 ? <p className="text-muted-foreground italic">Nessuna categoria.</p>
        : <div className="border-y border-border"><SortableList items={childrenOf(null)} onReorder={reorder} renderItem={(c) => renderTree(c, 0)} /></div>}
      {(editing || creating) && (
        <CategoryDialog page={page} categories={categories} category={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); onChange(); }} />
      )}
      <ConfirmDelete open={!!toDelete} title="Eliminare la categoria?"
        description="Verranno eliminati anche tutti i prodotti e le sotto-categorie associati. Operazione irreversibile."
        onCancel={() => setToDelete(null)} onConfirm={() => toDelete && doDelete(toDelete)} />
    </div>
  );
}

function CategoryDialog({ page, categories, category, onClose, onSaved }: { page: string; categories: MenuCategory[]; category: MenuCategory | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [timeRange, setTimeRange] = useState(category?.time_range ?? "");
  const [cover, setCover] = useState(category?.cover_charge ? formatPrice(category.cover_charge) : "");
  const [parentId, setParentId] = useState<string>(category?.parent_id ?? NONE);
  const [visible, setVisible] = useState(category?.is_visible ?? true);
  const [saving, setSaving] = useState(false);

  // exclude self and descendants from possible parents
  const blocked = new Set<string>();
  if (category) {
    blocked.add(category.id);
    for (let changed = true; changed;) {
      changed = false;
      for (const c of categories) if (c.parent_id && blocked.has(c.parent_id) && !blocked.has(c.id)) { blocked.add(c.id); changed = true; }
    }
  }
  const possibleParents = categories.filter((c) => !blocked.has(c.id));

  async function save() {
    if (!name.trim()) { toast.error("Nome obbligatorio"); return; }
    const coverN = cover.trim() ? parsePrice(cover) : 0;
    if (coverN === null) { toast.error("Coperto non valido"); return; }
    setSaving(true);
    const parent = parentId === NONE ? null : parentId;
    const base = { name: name.trim(), description: cleanRich(description), time_range: timeRange.trim() || null, cover_charge: coverN || null, parent_id: parent, is_visible: visible };
    const siblings = categories.filter((c) => c.parent_id === parent);
    const { error } = category
      ? await supabase.from("menu_categories").update(category.parent_id === parent ? base : { ...base, sort_order: siblings.length + 1 }).eq("id", category.id)
      : await supabase.from("menu_categories").insert({ ...base, page, slug: `${slugify(name) || "cat"}-${Date.now().toString(36)}`, sort_order: siblings.length + 1 });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(category ? "Categoria aggiornata" : "Categoria creata"); onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{category ? "Modifica categoria" : "Nuova categoria"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Sotto-categoria di</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Nessuna (categoria principale) —</SelectItem>
                {possibleParents.map((p) => <SelectItem key={p.id} value={p.id}>{catPath(p, categories)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <div className="space-y-2 flex-1"><Label>Orario / Sotto-titolo</Label><Input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} /></div>
            <div className="space-y-2 w-32"><Label>Coperto €</Label><Input inputMode="decimal" value={cover} placeholder="0,00" onChange={(e) => setCover(e.target.value)} onBlur={() => { const n = parsePrice(cover); if (cover && n !== null) setCover(formatPrice(n)); }} /></div>
          </div>
          <div className="space-y-2"><Label>Nota</Label><div className="rounded-md bg-site-bg p-1"><RichEditor value={description} onChange={setDescription} /></div></div>
          <div className="flex items-center gap-2"><Switch checked={visible} onCheckedChange={setVisible} id="vis-cat" /><Label htmlFor="vis-cat">Visibile</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvataggio…" : "Salva"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function catPath(c: MenuCategory, all: MenuCategory[]): string {
  const parts = [c.name];
  let cur = c;
  for (let i = 0; i < 5 && cur.parent_id; i++) {
    const p = all.find((x) => x.id === cur.parent_id); if (!p) break;
    parts.unshift(p.name); cur = p;
  }
  return parts.join(" › ");
}

/* ---------------- Prodotti ---------------- */
function ProductsManager({ page, categories, products, loading, onChange }: { page: string; categories: MenuCategory[]; products: MenuItem[]; loading: boolean; onChange: () => void }) {
  const [filterCat, setFilterCat] = useState("__all__");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<MenuItem | null>(null);

  useEffect(() => setFilterCat("__all__"), [page]);

  const key = (p: MenuItem) => p.category_id ?? NONE;
  const filtered = filterCat === "__all__" ? products : products.filter((p) => key(p) === filterCat);
  const label = (id: string) => {
    if (id === NONE) return "Senza categoria (diretti nella pagina)";
    const c = categories.find((x) => x.id === id);
    return c ? catPath(c, categories) : "—";
  };

  // groups follow category tree order
  const orderedCats: MenuCategory[] = [];
  const walk = (parent: string | null) => categories.filter((c) => c.parent_id === parent).forEach((c) => { orderedCats.push(c); walk(c.id); });
  walk(null);
  const groupKeys = [NONE, ...orderedCats.map((c) => c.id)];
  const groups = groupKeys.map((k) => [k, filtered.filter((p) => key(p) === k)] as const).filter(([, items]) => items.length > 0);

  async function patch(p: MenuItem, fields: Partial<MenuItem>) {
    const { error } = await supabase.from("menu_items").update(fields).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    onChange();
  }
  async function doDelete(p: MenuItem) {
    const { error } = await supabase.from("menu_items").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Prodotto eliminato"); setToDelete(null); onChange();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-muted-foreground">Filtra per categoria</Label>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[280px] max-w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tutte</SelectItem>
              <SelectItem value={NONE}>{label(NONE)}</SelectItem>
              {orderedCats.map((c) => <SelectItem key={c.id} value={c.id}>{label(c.id)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <GlobalPriceColor />
          <Button onClick={() => setCreating(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nuovo prodotto</Button>
        </div>
      </div>

      {loading && products.length === 0 ? <p className="text-muted-foreground">Caricamento…</p>
        : groups.length === 0 ? <p className="text-muted-foreground italic">Nessun prodotto.</p>
        : (
          <div className="space-y-6">
            {groups.map(([catId, items]) => (
              <div key={catId}>
                {filterCat === "__all__" && <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">{label(catId)}</p>}
                <div className="border-y border-border">
                  <SortableList items={[...items]} onReorder={async (next) => { await persistOrder("menu_items", next); onChange(); }}
                    renderItem={(p) => (
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${p.is_visible ? "" : "text-muted-foreground line-through"}`}>
                            {p.name}<span className="ml-3 text-amber-400 tabular-nums" style={{ color: p.price_color || undefined }}>€ {formatPrice(p.price)}</span>
                          </p>
                          {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{strip(p.description)}</p>}
                        </div>
                        <RowActions visible={p.is_visible} onToggle={() => patch(p, { is_visible: !p.is_visible })} onEdit={() => setEditing(p)} onDelete={() => setToDelete(p)} />
                      </div>
                    )} />
                </div>
              </div>
            ))}
          </div>
        )}

      {(editing || creating) && (
        <ProductDialog page={page} categories={categories} products={products} product={editing}
          defaultCategoryId={filterCat !== "__all__" ? filterCat : (orderedCats[0]?.id ?? NONE)}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); onChange(); }} />
      )}
      <ConfirmDelete open={!!toDelete} title="Eliminare il prodotto?" description="Operazione irreversibile."
        onCancel={() => setToDelete(null)} onConfirm={() => toDelete && doDelete(toDelete)} />
    </div>
  );
}

function ProductDialog({ page, categories, products, product, defaultCategoryId, onClose, onSaved }: {
  page: string; categories: MenuCategory[]; products: MenuItem[]; product: MenuItem | null; defaultCategoryId: string; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? formatPrice(product.price) : "");
  const [categoryId, setCategoryId] = useState(product ? (product.category_id ?? NONE) : defaultCategoryId);
  const [visible, setVisible] = useState(product?.is_visible ?? true);
  const [featured, setFeatured] = useState(!!product?.is_featured);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [priceColor, setPriceColor] = useState(product?.price_color ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) { toast.error("Nome obbligatorio"); return; }
    const n = price.trim() ? parsePrice(price) : 0;
    if (n === null) { toast.error("Prezzo non valido"); return; }
    setSaving(true);
    const cat = categoryId === NONE ? null : categoryId;
    const base = { name: name.trim(), description: cleanRich(description) || null, price: n, category_id: cat, page: cat ? null : page, is_visible: visible, is_featured: featured, image_url: imageUrl || null, price_color: priceColor || null };
    const groupSize = products.filter((p) => (p.category_id ?? NONE) === categoryId).length;
    const moved = !product || (product.category_id ?? NONE) !== categoryId;
    const payload = moved ? { ...base, sort_order: groupSize + 1 } : base;
    const { error } = product
      ? await supabase.from("menu_items").update(payload).eq("id", product.id)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(product ? "Prodotto aggiornato" : "Prodotto creato"); onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? "Modifica prodotto" : "Nuovo prodotto"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Nessuna (diretto nella pagina) —</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{catPath(c, categories)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prezzo € (es. 6,50)</Label>
            <Input inputMode="decimal" value={price} placeholder="0,00" onChange={(e) => setPrice(e.target.value)} onBlur={() => { const n = parsePrice(price); if (price && n !== null) setPrice(formatPrice(n)); }} />
          </div>
          <div className="space-y-2">
            <Label>Colore del prezzo (solo per questo prodotto)</Label>
            <div className="flex items-center gap-3">
              <input type="color" aria-label="Colore del prezzo" value={priceColor || "#d6d3d1"} onChange={(e) => setPriceColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent" />
              <span className="text-sm tabular-nums" style={{ color: priceColor || undefined }}>€ {price || "0,00"}</span>
              {priceColor ? <Button variant="ghost" size="sm" onClick={() => setPriceColor("")}>Usa colore generale</Button> : <span className="text-xs text-muted-foreground">Usa il colore generale</span>}
            </div>
          </div>
          <div className="space-y-2"><Label>Descrizione</Label><div className="rounded-md bg-site-bg p-1"><RichEditor value={description} onChange={setDescription} /></div></div>
          <div className="space-y-2">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              {imageUrl && <img src={imageUrl} alt="" className="w-14 h-14 object-cover rounded" />}
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer"><ImagePlus className="h-4 w-4 mr-1" />{uploading ? "Caricamento…" : imageUrl ? "Cambia" : "Carica"}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    setUploading(true);
                    try { setImageUrl(await uploadImage(f, "products")); } catch (err) { toast.error((err as Error).message); }
                    setUploading(false);
                  }} />
                </label>
              </Button>
              {imageUrl && <Button variant="ghost" size="sm" onClick={() => setImageUrl("")}>Rimuovi</Button>}
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2"><Switch checked={visible} onCheckedChange={setVisible} id="vis-p" /><Label htmlFor="vis-p">Visibile</Label></div>
            <div className="flex items-center gap-2"><Switch checked={featured} onCheckedChange={setFeatured} id="feat-p" /><Label htmlFor="feat-p">In evidenza</Label></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvataggio…" : "Salva"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Ricerca ---------------- */
function SearchDialog({ open, onOpenChange, pages, onJump }: { open: boolean; onOpenChange: (o: boolean) => void; pages: SitePage[]; onJump: (page: string, tab: Tab) => void }) {
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([supabase.from("menu_categories").select("*"), supabase.from("menu_items").select("*")]).then(([c, i]) => {
      setCats(c.data ?? []); setItems(i.data ?? []); setLoading(false);
    });
  }, [open]);

  const q = query.trim().toLowerCase();
  const pageTitle = (slug: string) => pages.find((p) => p.slug === slug)?.title ?? slug;
  const mc = q ? cats.filter((c) => c.name.toLowerCase().includes(q)) : [];
  const mp = q ? items.filter((p) => p.name.toLowerCase().includes(q)) : [];
  const itemPage = (p: MenuItem) => (p.category_id ? cats.find((c) => c.id === p.category_id)?.page : p.page) ?? "";
  const itemPath = (p: MenuItem) => {
    const c = p.category_id ? cats.find((x) => x.id === p.category_id) : null;
    return `${pageTitle(itemPage(p))} › ${c ? catPath(c, cats) : "senza categoria"}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Cerca nel catalogo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome di categoria, sotto-categoria o prodotto…" className="pl-9" />
          </div>
          <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
            {loading ? <p className="text-muted-foreground text-sm">Caricamento…</p>
              : !q ? <p className="text-muted-foreground text-sm italic">Inizia a digitare per cercare.</p>
              : mc.length === 0 && mp.length === 0 ? <p className="text-muted-foreground text-sm italic">Nessun risultato.</p>
              : (
                <div className="space-y-6">
                  {mc.length > 0 && (
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Categorie e sotto-categorie ({mc.length})</p>
                      <ul className="divide-y divide-border border-y border-border">
                        {mc.map((c) => (
                          <li key={c.id}>
                            <button type="button" onClick={() => onJump(c.page, "categories")} className="w-full text-left py-2 px-1 hover:bg-muted transition-colors">
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{pageTitle(c.page)} › {catPath(c, cats)}{!c.is_visible && " · nascosta"}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {mp.length > 0 && (
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Prodotti ({mp.length})</p>
                      <ul className="divide-y divide-border border-y border-border">
                        {mp.map((p) => (
                          <li key={p.id}>
                            <button type="button" onClick={() => onJump(itemPage(p), "products")} className="w-full text-left py-2 px-1 hover:bg-muted transition-colors">
                              <p className="font-medium">{p.name}<span className="ml-2 text-amber-400 tabular-nums">€ {formatPrice(p.price)}</span></p>
                              <p className="text-xs text-muted-foreground">{itemPath(p)}{!p.is_visible && " · nascosto"}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GlobalPriceColor() {
  const qc = useQueryClient();
  const [color, setColor] = useState("");
  useEffect(() => { getSettings().then((s) => setColor(s[PRICE_COLOR_KEY] ?? "")).catch(() => {}); }, []);
  async function save(value: string) {
    setColor(value);
    try { await saveSetting(PRICE_COLOR_KEY, value); await qc.invalidateQueries({ queryKey: ["settings"] }); toast.success(value ? "Colore prezzi salvato" : "Colore prezzi predefinito ripristinato"); }
    catch { toast.error("Salvataggio non riuscito"); }
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs tracking-widest uppercase text-muted-foreground">Colore generale prezzi</Label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label="Colore generale dei prezzi" value={color || "#d6d3d1"} onChange={(e) => setColor(e.target.value)} onBlur={(e) => save(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent" />
        {color && <Button variant="ghost" size="sm" onClick={() => save("")}>Predefinito</Button>}
      </div>
    </div>
  );
}
