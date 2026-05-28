import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Главная", path: "/" },
  { label: "О нас", path: "/#about" },
  { label: "Вакансии", path: "/vacancies" },
  { label: "Резюме", path: "/resumes" },
  { label: "Блог", path: "/blog" },
  { label: "Контакты", path: "/#contacts" },
];

interface LayoutProps {
  children: React.ReactNode;
  onOpenVacancy?: () => void;
  onOpenResume?: () => void;
}

export default function Layout({ children, onOpenVacancy, onOpenResume }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = (path: string) => {
    setMobileOpen(false);
    if (path.startsWith("/#")) {
      navigate("/");
      setTimeout(() => {
        const id = path.replace("/#", "");
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      navigate(path);
      window.scrollTo(0, 0);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path.split("#")[0]) && path !== "/";
  };

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => goTo("/")} className="flex items-center gap-2">
            <span className="text-2xl">✝</span>
            <span className="font-display text-xl font-semibold text-warm-brown tracking-wide">Благодать</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => goTo(link.path)}
                className={`text-sm transition-colors hover:text-warm-brown ${isActive(link.path) ? "text-warm-brown font-semibold" : "text-muted-foreground"}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {onOpenVacancy && (
              <Button variant="outline" size="sm" onClick={onOpenVacancy} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground">
                Разместить вакансию
              </Button>
            )}
            {onOpenResume && (
              <Button size="sm" onClick={onOpenResume} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                Разместить резюме
              </Button>
            )}
            {!onOpenVacancy && !onOpenResume && (
              <>
                <Button variant="outline" size="sm" onClick={() => goTo("/vacancies")} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground">
                  Вакансии
                </Button>
                <Button size="sm" onClick={() => goTo("/resumes")} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                  Резюме
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-background border-t border-border px-4 pb-4">
            {NAV_LINKS.map((link) => (
              <button key={link.path} onClick={() => goTo(link.path)} className="block w-full text-left py-3 text-sm border-b border-border last:border-0 hover:text-warm-brown">
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="bg-warm-brown py-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl text-primary-foreground/80">✝</span>
              <span className="font-display text-xl font-semibold text-primary-foreground tracking-wide">Благодать</span>
            </div>
            <p className="font-display text-primary-foreground/60 text-sm italic text-center">
              «Всё, что делаете, делайте от души, как для Господа» — Кол. 3:23
            </p>
            <div className="flex gap-5 flex-wrap justify-center">
              {NAV_LINKS.map((link) => (
                <button key={link.path} onClick={() => goTo(link.path)} className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center">
            <p className="text-xs text-primary-foreground/40">© 2026 Благодать. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
