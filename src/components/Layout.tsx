import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getVisiblePages } from "@/lib/cms";
import logoAsset from "@/assets/logo-trattoria.png.asset.json";

const logo = logoAsset.url;

const SYSTEM = ["menu", "caffetteria", "drink", "vini"] as const;
const defaultPages = [
  { slug: "menu", title: "Menù" },
  { slug: "caffetteria", title: "Caffetteria" },
  { slug: "drink", title: "Drink List" },
  { slug: "vini", title: "Carta dei Vini" },
];

function NavLink({ to, className, children }: { to: string; className: string; children: ReactNode }) {
  if (to.startsWith("/p/")) return <Link to="/p/$slug" params={{ slug: to.slice(3) }} className={className}>{children}</Link>;
  return <Link to={to as "/"} className={className}>{children}</Link>;
}

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useLocation({ select: (l) => l.pathname });
  const { data: pages } = useQuery({ queryKey: ["pages"], queryFn: getVisiblePages });
  const navLinks = [
    { to: "/", label: "Home" },
    ...(pages ?? defaultPages).map((p) => ({
      to: (SYSTEM as readonly string[]).includes(p.slug) ? `/${p.slug}` : `/p/${p.slug}`,
      label: p.title,
    })),
    { to: "/contatti", label: "Contatti" },
  ];

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-stone-950/95 backdrop-blur-md shadow-lg shadow-black/20" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="Giannino Bistrot Cafè"
                className="h-10 sm:h-12 w-auto rounded-md bg-stone-50 object-contain shrink-0"
              />
              <div className="leading-tight">
                <div className="text-base sm:text-lg font-serif font-semibold tracking-wide text-stone-50">
                  Giannino Bistrot &middot; Cafè
                </div>
                <div className="text-[10px] sm:text-xs tracking-[0.25em] text-amber-500/80 uppercase">
                  Est. 1974
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 text-sm tracking-wide transition-colors rounded-md ${
                    pathname === link.to
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-stone-400 hover:text-amber-400 hover:bg-stone-800/50"
                  }`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-stone-300 hover:text-amber-400 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          sidebarOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`absolute top-0 right-0 h-full w-72 bg-stone-900 border-l border-stone-800 shadow-2xl transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 pt-20">
            <div className="mb-8 flex flex-col items-center text-center">
              <img src={logo} alt="Giannino Bistrot Cafè" className="h-20 w-auto rounded-lg bg-stone-50 object-contain mb-3" />
              <div className="font-serif text-lg text-stone-100">Giannino Bistrot &middot; Cafè</div>
              <div className="text-xs tracking-[0.25em] text-amber-500/80 uppercase mt-0.5">Est. 1974</div>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 text-base tracking-wide rounded-lg transition-colors ${
                    pathname === link.to
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-stone-300 hover:text-amber-400 hover:bg-stone-800/50"
                  }`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <main>{children}</main>

      <footer className="border-t border-stone-800/60 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center text-center">
            <img src={logo} alt="Giannino Bistrot Cafè" className="h-20 w-auto rounded-lg bg-stone-50 object-contain mb-4" />
            <div className="font-serif text-lg text-stone-100 mb-1">Giannino Bistrot &middot; Cafè</div>
            <p className="text-sm text-stone-500 mb-6">Stesse radici, nuovo orizzonte.</p>
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className="text-sm text-stone-400 hover:text-amber-400 transition-colors">
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-stone-600">
              <span>&copy; {new Date().getFullYear()} Giannino Bistrot Cafè. Tutti i diritti riservati.</span>
              <Button asChild variant="link" size="sm" className="h-auto px-0 py-1 text-xs text-site-muted hover:text-site-accent">
                <Link to="/admin"><LockKeyhole className="size-3" aria-hidden="true" />Area Riservata</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
