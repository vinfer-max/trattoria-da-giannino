ALTER TABLE public.menu_items ALTER COLUMN category_id DROP NOT NULL;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS page text;
CREATE INDEX IF NOT EXISTS menu_items_page_idx ON public.menu_items(page) WHERE category_id IS NULL;