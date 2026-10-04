import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, Plus, Trash2, Pencil, Save, X, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { MenuCategory, MenuItem } from "@/lib/menu";

type PageKey = "menu" | "caffetteria" | "drink" | "vini";
const pages: { key: PageKey; label: string }[] = [
  { key: "menu", label: "Menù" },
  { key: "caffetteria", label: "Caffetteria" },
  { key: "drink", label: "Drink List" },
  { key: "vini", label: "Carta dei Vini" },
];

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

function AdminGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(false);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="pt-20 sm:pt-24">
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-100 mb-3">Admin</h1>
          <p className="text-stone-400 text-lg">Gestione menù e contenuti</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {!ready ? (
          <div className="text-center py-12 text-stone-400">Caricamento…</div>
        ) : !session ? (
          <LoginForm />
        ) : !isAdmin ? (
          <div className="text-center text-stone-400 space-y-4">
            <p>Il tuo account non ha i permessi di amministratore.</p>
            <button onClick={() => supabase.auth.signOut()} className="text-amber-400 underline">Esci</button>
          </div>
        ) : (
          <AdminPanel />
        )}
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
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (res.error) setMsg(res.error.message);
    else if (mode === "up" && !res.data.session) setMsg("Controlla la tua email per confermare l'account.");
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto space-y-3 p-6 rounded-xl bg-stone-900/50 border border-stone-800/60">
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

function AdminPanel() {
  const [activePage, setActivePage] = useState<PageKey>("menu");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "" });
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    loadData();
  }, [activePage]);

  async function loadData() {
    setLoading(true);
    const { data: cats } = await supabase.from("menu_categories").select("*").eq("page", activePage).order("sort_order");
    const { data: menuItems } = await supabase.from("menu_items").select("*").order("sort_order");
    setCategories(cats || []);
    setItems(menuItems || []);
    setLoading(false);
  }

  async function deleteItem(id: string) {
    await supabase.from("menu_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function startEdit(item: MenuItem) {
    setEditingItem(item.id);
    setEditForm({ name: item.name, description: item.description ?? "", price: String(item.price) });
  }

  async function saveEdit(item: MenuItem) {
    const updates = { name: editForm.name, description: editForm.description, price: parseFloat(editForm.price) || 0 };
    await supabase.from("menu_items").update(updates).eq("id", item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...updates } : i)));
    setEditingItem(null);
  }

  async function addItem(categoryId: string) {
    const { data } = await supabase
      .from("menu_items")
      .insert({
        category_id: categoryId,
        name: "Nuovo elemento",
        description: "",
        price: 0,
        sort_order: items.filter((i) => i.category_id === categoryId).length + 1,
      })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data]);
  }

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data } = await supabase
      .from("menu_categories")
      .insert({ name, slug, page: activePage, sort_order: categories.length + 1 })
      .select()
      .single();
    if (data) setCategories((prev) => [...prev, data]);
    setNewCat("");
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400">
          <LogOut className="w-3.5 h-3.5" /> Esci
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {pages.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePage(p.key)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              activePage === p.key ? "bg-amber-500 text-stone-950 font-semibold" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-8">
        <input className={`${inputCls} flex-1`} placeholder="Nuova categoria" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
        <button onClick={addCategory} className="flex items-center gap-1.5 px-3 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Categoria
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-400">Caricamento…</div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <div key={cat.id} className="rounded-xl bg-stone-900/50 border border-stone-800/60 overflow-hidden">
                <div className="px-6 py-4 bg-stone-800/30 border-b border-stone-800/60 flex items-center justify-between">
                  <h2 className="text-xl font-serif text-amber-400">{cat.name}</h2>
                  <button onClick={() => addItem(cat.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Aggiungi
                  </button>
                </div>
                <div className="divide-y divide-stone-800/40">
                  {catItems.map((item) => (
                    <div key={item.id} className="px-6 py-3 flex items-center gap-4">
                      {editingItem === item.id ? (
                        <>
                          <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={`${inputCls} flex-1`} />
                          <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrizione" className={`${inputCls} flex-1`} />
                          <input value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} type="number" step="0.5" placeholder="Prezzo" className={`${inputCls} w-20`} />
                          <button onClick={() => saveEdit(item)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingItem(null)} className="p-1.5 text-stone-400 hover:bg-stone-700 rounded"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="text-stone-200">{item.name}</span>
                            {item.description && <span className="text-stone-400 text-sm ml-2">— {item.description}</span>}
                          </div>
                          <span className="text-stone-300 text-sm tabular-nums">{Number(item.price) > 0 ? `€${item.price}` : ""}</span>
                          <button onClick={() => startEdit(item)} className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-700 rounded"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteItem(item.id)} className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  ))}
                  {catItems.length === 0 && <div className="px-6 py-4 text-sm text-stone-500 italic">Nessun elemento</div>}
                </div>
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-center text-stone-500 italic">Nessuna categoria su questa pagina.</p>}
        </div>
      )}
    </>
  );
}
