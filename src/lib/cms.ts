import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SitePage = Tables<"site_pages">;
export type HomeSlide = Tables<"home_slides">;
export type HomeSection = Tables<"home_sections">;
export type SiteEvent = Tables<"events">;

export async function getVisiblePages(): Promise<SitePage[]> {
  const { data, error } = await supabase.from("site_pages").select("*").eq("is_visible", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getPageBySlug(slug: string): Promise<SitePage | null> {
  const { data, error } = await supabase.from("site_pages").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const r of data ?? []) out[r.key] = r.value ?? "";
  return out;
}

export async function saveSetting(key: string, value: string) {
  const { data, error } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
  if (error) throw error;
  const result = data
    ? await supabase.from("site_settings").update({ value }).eq("id", data.id)
    : await supabase.from("site_settings").insert({ key, value });
  if (result.error) throw result.error;
}

export interface HomeData {
  settings: Record<string, string>;
  slides: HomeSlide[];
  sections: HomeSection[];
  events: SiteEvent[];
}

export async function getHomeData(): Promise<HomeData> {
  const today = new Date().toISOString().slice(0, 10);
  const [settings, slides, sections, events] = await Promise.all([
    getSettings(),
    supabase.from("home_slides").select("*").eq("is_visible", true).order("sort_order"),
    supabase.from("home_sections").select("*").eq("is_visible", true).order("sort_order"),
    supabase.from("events").select("*").eq("is_visible", true).or(`event_date.is.null,event_date.gte.${today}`).order("event_date"),
  ]);
  return { settings, slides: slides.data ?? [], sections: sections.data ?? [], events: events.data ?? [] };
}

/** Uploads an image and returns a long-lived URL usable on the public site. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("site-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 20);
  if (e2 || !data) throw e2 ?? new Error("URL non disponibile");
  return data.signedUrl;
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
