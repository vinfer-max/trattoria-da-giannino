import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MenuCategory = Tables<"menu_categories">;
export type MenuItem = Tables<"menu_items">;

export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
  children: CategoryWithItems[];
}

export function buildTree(categories: MenuCategory[], items: MenuItem[]): CategoryWithItems[] {
  const map = new Map<string, CategoryWithItems>();
  categories.forEach((c) => map.set(c.id, { ...c, items: items.filter((i) => i.category_id === c.id), children: [] }));
  const roots: CategoryWithItems[] = [];
  categories.forEach((c) => {
    const node = map.get(c.id)!;
    const parent = c.parent_id ? map.get(c.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else if (!c.parent_id) roots.push(node);
  });
  return roots;
}

/** Public: only visible categories/items for a page, as a tree. */
export async function getMenuPage(page: string): Promise<CategoryWithItems[]> {
  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("page", page)
    .eq("is_visible", true)
    .order("sort_order");
  if (catError) throw catError;
  if (!categories || categories.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_visible", true)
    .in("category_id", categories.map((c) => c.id))
    .order("sort_order");
  if (itemsError) throw itemsError;

  return buildTree(categories, items ?? []);
}

/** Public: visible products placed directly on a page (no category). */
export async function getPageDirectItems(page: string): Promise<MenuItem[]> {
  const { data, error } = await supabase.from("menu_items").select("*").eq("page", page).is("category_id", null).eq("is_visible", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}
