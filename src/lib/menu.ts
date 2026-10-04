import { supabase } from "@/integrations/supabase/client";

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  time_range: string | null;
  cover_charge: number | null;
  sort_order: number | null;
  page: string;
  created_at: string | null;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_featured: boolean | null;
  sort_order: number | null;
  created_at: string | null;
}

export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export async function getMenuPage(page: string): Promise<CategoryWithItems[]> {
  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("page", page)
    .order("sort_order");
  if (catError) throw catError;
  if (!categories || categories.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .in(
      "category_id",
      categories.map((c) => c.id),
    )
    .order("sort_order");
  if (itemsError) throw itemsError;

  return categories.map((cat) => ({
    ...cat,
    items: (items || []).filter((item) => item.category_id === cat.id),
  }));
}
