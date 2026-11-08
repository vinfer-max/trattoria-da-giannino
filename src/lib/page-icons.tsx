import {
  UtensilsCrossed, Coffee, Wine, Martini, BookOpen, Info, Users, Heart, Pizza, Fish, Beef, Salad,
  Soup, CakeSlice, IceCreamCone, Croissant, Sandwich, Beer, GlassWater, CupSoda, Leaf, Wheat,
  ChefHat, Star, Sun, Moon, Calendar, MapPin, Phone, Camera, Gift, Sparkles, Flame, Grape, Egg, Cookie,
  type LucideIcon,
} from "lucide-react";

export const PAGE_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  utensils: { label: "Posate", Icon: UtensilsCrossed },
  chef: { label: "Chef", Icon: ChefHat },
  coffee: { label: "Caffè", Icon: Coffee },
  croissant: { label: "Cornetto", Icon: Croissant },
  wine: { label: "Vino", Icon: Wine },
  grape: { label: "Uva", Icon: Grape },
  martini: { label: "Cocktail", Icon: Martini },
  beer: { label: "Birra", Icon: Beer },
  water: { label: "Acqua", Icon: GlassWater },
  soda: { label: "Bibita", Icon: CupSoda },
  pizza: { label: "Pizza", Icon: Pizza },
  fish: { label: "Pesce", Icon: Fish },
  beef: { label: "Carne", Icon: Beef },
  salad: { label: "Insalata", Icon: Salad },
  soup: { label: "Zuppa", Icon: Soup },
  sandwich: { label: "Panino", Icon: Sandwich },
  egg: { label: "Uovo", Icon: Egg },
  wheat: { label: "Grano", Icon: Wheat },
  leaf: { label: "Vegetale", Icon: Leaf },
  cake: { label: "Dolce", Icon: CakeSlice },
  cookie: { label: "Biscotto", Icon: Cookie },
  icecream: { label: "Gelato", Icon: IceCreamCone },
  book: { label: "Libro", Icon: BookOpen },
  info: { label: "Info", Icon: Info },
  users: { label: "Persone", Icon: Users },
  heart: { label: "Cuore", Icon: Heart },
  star: { label: "Stella", Icon: Star },
  sparkles: { label: "Scintille", Icon: Sparkles },
  flame: { label: "Fiamma", Icon: Flame },
  sun: { label: "Sole", Icon: Sun },
  moon: { label: "Luna", Icon: Moon },
  calendar: { label: "Calendario", Icon: Calendar },
  map: { label: "Luogo", Icon: MapPin },
  phone: { label: "Telefono", Icon: Phone },
  camera: { label: "Foto", Icon: Camera },
  gift: { label: "Regalo", Icon: Gift },
};

export function PageIcon({ name, fallback }: { name?: string | null; fallback?: React.ReactNode }) {
  const entry = name ? PAGE_ICONS[name] : undefined;
  if (!entry) return <>{fallback ?? null}</>;
  const { Icon } = entry;
  return <Icon />;
}
