ALTER TABLE public.site_pages ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '';
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS price_color text;