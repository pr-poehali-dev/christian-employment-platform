import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, Vacancy, Resume } from "@/lib/api";

const HERO_IMG = "https://cdn.poehali.dev/projects/196c2a98-b24c-4dcb-b174-1f12b6760cec/files/a2976b3e-f63c-43e8-9715-55bfba4cc4f5.jpg";
const ABOUT_IMG = "https://cdn.poehali.dev/projects/196c2a98-b24c-4dcb-b174-1f12b6760cec/files/b8ec5ba9-0a83-4558-97c4-2880b5a6a91f.jpg";

const NAV_LINKS = [
  { label: "Главная", id: "home" },
  { label: "О нас", id: "about" },
  { label: "Вакансии", id: "vacancies" },
  { label: "Резюме", id: "resumes" },
  { label: "Блог", id: "blog" },
  { label: "Контакты", id: "contacts" },
];

const BLOG_POSTS = [
  { id: 1, date: "12 мая 2026", title: "Как найти призвание в работе?", excerpt: "О том, как христианские ценности помогают выстраивать профессиональный путь с внутренним миром.", tag: "Призвание" },
  { id: 2, date: "5 мая 2026", title: "Честность на собеседовании", excerpt: "Почему честность — не слабость, а сила. Как говорить о себе правду и оставаться собой.", tag: "Советы" },
  { id: 3, date: "28 апреля 2026", title: "Служение через профессию", excerpt: "Каждая профессия может стать служением. История нескольких наших соискателей.", tag: "Истории" },
];

const SPECS = ["Все специальности", "Образование", "Финансы", "Социальная сфера", "IT", "Психология", "Творчество"];
const CITIES = ["Все города", "Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Удалённо"];
const SALARY_RANGES = [
  { label: "Любая зарплата", min: "", max: "" },
  { label: "до 50 000 ₽", min: "", max: "50000" },
  { label: "50 000 – 80 000 ₽", min: "50000", max: "80000" },
  { label: "80 000 – 120 000 ₽", min: "80000", max: "120000" },
  { label: "от 120 000 ₽", min: "120000", max: "" },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Vacancies state
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [vacLoading, setVacLoading] = useState(false);
  const [vacSpec, setVacSpec] = useState("Все специальности");
  const [vacCity, setVacCity] = useState("Все города");
  const [vacSalaryLabel, setVacSalaryLabel] = useState("Любая зарплата");
  const [vacSearch, setVacSearch] = useState("");
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  // Resumes state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resSpec, setResSpec] = useState("Все специальности");
  const [resCity, setResCity] = useState("Все города");
  const [resSalaryLabel, setResSalaryLabel] = useState("Любая зарплата");
  const [resSearch, setResSearch] = useState("");

  // Modal states
  const [vacModal, setVacModal] = useState(false);
  const [resModal, setResModal] = useState(false);
  const [respondModal, setRespondModal] = useState(false);
  const [respondVacancy, setRespondVacancy] = useState<Vacancy | null>(null);

  // Form states
  const [vacForm, setVacForm] = useState({ title: "", organization: "", city: "", specialty: "", employment_type: "", description: "", salary_from: "", salary_to: "", contact_email: "", contact_phone: "" });
  const [resForm, setResForm] = useState({ first_name: "", last_name: "", title: "", city: "", specialty: "", experience_years: "", salary_from: "", about: "", contact_email: "", contact_phone: "" });
  const [respondForm, setRespondForm] = useState({ name: "", contact: "", message: "" });
  const [contactForm, setContactForm] = useState({ name: "", contact: "", message: "" });

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadVacancies = useCallback(async () => {
    setVacLoading(true);
    try {
      const salaryRange = SALARY_RANGES.find(r => r.label === vacSalaryLabel) || SALARY_RANGES[0];
      const data = await api.vacancies.list({
        specialty: vacSpec === "Все специальности" ? "" : vacSpec,
        city: vacCity === "Все города" ? "" : vacCity,
        salary_min: salaryRange.min,
        salary_max: salaryRange.max,
        search: vacSearch,
      });
      setVacancies(data.vacancies);
    } finally {
      setVacLoading(false);
    }
  }, [vacSpec, vacCity, vacSalaryLabel, vacSearch]);

  const loadResumes = useCallback(async () => {
    setResLoading(true);
    try {
      const salaryRange = SALARY_RANGES.find(r => r.label === resSalaryLabel) || SALARY_RANGES[0];
      const data = await api.resumes.list({
        specialty: resSpec === "Все специальности" ? "" : resSpec,
        city: resCity === "Все города" ? "" : resCity,
        salary_min: salaryRange.min,
        search: resSearch,
      });
      setResumes(data.resumes);
    } finally {
      setResLoading(false);
    }
  }, [resSpec, resCity, resSalaryLabel, resSearch]);

  useEffect(() => { loadVacancies(); }, [loadVacancies]);
  useEffect(() => { loadResumes(); }, [loadResumes]);

  const handleCreateVacancy = async () => {
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.vacancies.create({ ...vacForm, salary_from: vacForm.salary_from ? Number(vacForm.salary_from) : undefined, salary_to: vacForm.salary_to ? Number(vacForm.salary_to) : undefined });
      setFormSuccess("Вакансия успешно размещена!");
      setVacForm({ title: "", organization: "", city: "", specialty: "", employment_type: "", description: "", salary_from: "", salary_to: "", contact_email: "", contact_phone: "" });
      loadVacancies();
      setTimeout(() => { setVacModal(false); setFormSuccess(""); }, 2000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateResume = async () => {
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.resumes.create({ ...resForm, salary_from: resForm.salary_from ? Number(resForm.salary_from) : undefined, experience_years: resForm.experience_years ? Number(resForm.experience_years) : 0 });
      setFormSuccess("Резюме успешно размещено!");
      setResForm({ first_name: "", last_name: "", title: "", city: "", specialty: "", experience_years: "", salary_from: "", about: "", contact_email: "", contact_phone: "" });
      loadResumes();
      setTimeout(() => { setResModal(false); setFormSuccess(""); }, 2000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!respondVacancy) return;
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.vacancies.respond({ vacancy_id: respondVacancy.id, ...respondForm });
      setFormSuccess("Отклик отправлен работодателю!");
      setRespondForm({ name: "", contact: "", message: "" });
      setTimeout(() => { setRespondModal(false); setFormSuccess(""); }, 2000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setFormLoading(false);
    }
  };

  const handleContact = async () => {
    setContactLoading(true); setContactSuccess("");
    try {
      await api.contacts.send(contactForm);
      setContactSuccess("Сообщение отправлено! Мы свяжемся с вами.");
      setContactForm({ name: "", contact: "", message: "" });
    } catch {
      setContactSuccess("Ошибка. Попробуйте позже.");
    } finally {
      setContactLoading(false);
    }
  };

  const tagColors: Record<string, string> = {
    "Срочно": "bg-red-100 text-red-700 border-red-200",
    "Горячая": "bg-orange-100 text-orange-700 border-orange-200",
    "Новая": "bg-sage/20 text-sage border-sage/30",
  };

  return (
    <div className="min-h-screen bg-background font-body">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("home")} className="flex items-center gap-2">
            <span className="text-2xl">✝</span>
            <span className="font-display text-xl font-semibold text-warm-brown tracking-wide">Благодать</span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className={`text-sm transition-colors hover:text-warm-brown ${activeSection === link.id ? "text-warm-brown font-semibold" : "text-muted-foreground"}`}>
                {link.label}
              </button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { setFormError(""); setFormSuccess(""); setVacModal(true); }} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground">
              Разместить вакансию
            </Button>
            <Button size="sm" onClick={() => { setFormError(""); setFormSuccess(""); setResModal(true); }} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
              Разместить резюме
            </Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border px-4 pb-4">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left py-3 text-sm border-b border-border last:border-0 hover:text-warm-brown">
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setVacModal(true)} className="border-warm-brown text-warm-brown">Разместить вакансию</Button>
              <Button size="sm" onClick={() => setResModal(true)} className="bg-warm-brown text-primary-foreground">Разместить резюме</Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="pt-16 min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${HERO_IMG})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-background to-light-sage/30" />
        <div className="container max-w-6xl mx-auto px-4 relative z-10 py-20">
          <div className="max-w-2xl">
            <p className="text-sm text-sage mb-4 tracking-widest uppercase animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>Христианское кадровое агентство</p>
            <h1 className="font-display text-6xl md:text-7xl font-light text-warm-brown leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
              Найди своё<br /><em className="font-medium">призвание</em>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 animate-fade-in max-w-lg" style={{ animationDelay: "0.3s", opacity: 0 }}>
              Помогаем людям с христианскими ценностями находить достойную работу и надёжных сотрудников.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
              <Button onClick={() => scrollTo("vacancies")} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90 px-8 h-12 text-base">Смотреть вакансии</Button>
              <Button variant="outline" onClick={() => scrollTo("resumes")} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground px-8 h-12 text-base">Найти сотрудника</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-20 max-w-lg">
            {[{ num: "250+", label: "Вакансий" }, { num: "180+", label: "Резюме" }, { num: "95%", label: "Успешных трудоустройств" }].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-4xl font-semibold text-warm-brown">{s.num}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 bg-light-sage/20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm text-sage mb-3 tracking-widest uppercase">О нас</p>
              <h2 className="font-display text-5xl font-light text-warm-brown leading-tight mb-6">Мы верим в силу<br /><em>доверия и служения</em></h2>
              <p className="text-muted-foreground leading-relaxed mb-5">«Благодать» — это кадровое агентство, созданное верующими для верующих. Мы убеждены, что работа — это не просто источник дохода, а возможность служить Богу и людям.</p>
              <p className="text-muted-foreground leading-relaxed mb-8">Мы тщательно проверяем каждого работодателя и кандидата, обеспечивая безопасную и честную среду для поиска работы.</p>
              <div className="grid grid-cols-2 gap-4">
                {[{ icon: "Heart", text: "Христианские ценности" }, { icon: "Shield", text: "Проверенные работодатели" }, { icon: "Users", text: "Личный подход" }, { icon: "BookOpen", text: "Духовная поддержка" }].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon as "Heart"} size={16} className="text-sage" />
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full bg-sage/10 rounded-2xl" />
              <img src={ABOUT_IMG} alt="О нас" className="relative rounded-2xl w-full object-cover aspect-[4/3] shadow-lg" />
              <div className="absolute -bottom-6 -right-6 bg-background rounded-xl p-4 shadow-lg border border-border">
                <p className="font-display text-2xl font-semibold text-warm-brown">7 лет</p>
                <p className="text-xs text-muted-foreground">на рынке труда</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vacancies */}
      <section id="vacancies" className="py-24 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-sage mb-3 tracking-widest uppercase">Работа</p>
            <h2 className="font-display text-5xl font-light text-warm-brown">Актуальные вакансии</h2>
          </div>
          <div className="bg-cream rounded-2xl p-6 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск..." value={vacSearch} onChange={(e) => setVacSearch(e.target.value)} className="pl-9 bg-background" />
              </div>
              <Select value={vacSpec} onValueChange={setVacSpec}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{SPECS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={vacCity} onValueChange={setVacCity}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={vacSalaryLabel} onValueChange={setVacSalaryLabel}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{SALARY_RANGES.map((r) => <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {vacLoading ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Loader" size={32} className="mx-auto mb-3 opacity-40 animate-spin" />
              <p>Загружаем вакансии...</p>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-xl">Вакансий не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтры или <button onClick={() => setVacModal(true)} className="text-warm-brown underline">разместите свою</button></p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vacancies.map((v) => (
                <div key={v.id} onClick={() => setSelectedVacancy(v)} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-light-sage flex items-center justify-center">
                      <span className="text-lg">✝</span>
                    </div>
                    {v.tag && <Badge className={`text-xs ${tagColors[v.tag] || "bg-sage/20 text-sage border-sage/30"}`} variant="outline">{v.tag}</Badge>}
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-warm-brown transition-colors">{v.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{v.organization}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MapPin" size={12} />{v.city}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Clock" size={12} />{v.employment_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-warm-brown text-sm">{v.salary}</span>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setRespondVacancy(v); setFormError(""); setFormSuccess(""); setRespondModal(true); }} className="text-warm-brown hover:bg-warm-brown/10 h-7 px-3 text-xs">
                      Откликнуться
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button onClick={() => { setFormError(""); setFormSuccess(""); setVacModal(true); }} variant="outline" className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground px-8">
              + Разместить вакансию
            </Button>
          </div>
        </div>
      </section>

      {/* Resumes */}
      <section id="resumes" className="py-24 bg-light-sage/15">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-sage mb-3 tracking-widest uppercase">Соискатели</p>
            <h2 className="font-display text-5xl font-light text-warm-brown">База резюме</h2>
          </div>
          <div className="bg-background rounded-2xl p-6 mb-8 border border-border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск..." value={resSearch} onChange={(e) => setResSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={resSpec} onValueChange={setResSpec}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SPECS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={resCity} onValueChange={setResCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={resSalaryLabel} onValueChange={setResSalaryLabel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SALARY_RANGES.map((r) => <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {resLoading ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Loader" size={32} className="mx-auto mb-3 opacity-40 animate-spin" />
              <p>Загружаем резюме...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-xl">Резюме не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтры или <button onClick={() => setResModal(true)} className="text-warm-brown underline">разместите своё</button></p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resumes.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage/30 to-gold/30 flex items-center justify-center">
                      <span className="font-display font-semibold text-warm-brown text-lg">
                        {(r.first_name?.[0] || "") + (r.last_name?.[0] || "")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-warm-brown transition-colors">{r.name}</h3>
                      <p className="text-xs text-sage">{r.exp}</p>
                    </div>
                  </div>
                  <p className="font-display text-base font-medium mb-3">{r.title}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MapPin" size={12} />{r.city}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Briefcase" size={12} />{r.specialty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-warm-brown text-sm">{r.salary}</span>
                    <Button size="sm" variant="ghost" className="text-warm-brown hover:bg-warm-brown/10 h-7 px-3 text-xs">Просмотреть</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button onClick={() => { setFormError(""); setFormSuccess(""); setResModal(true); }} variant="outline" className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground px-8">
              + Разместить резюме
            </Button>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="py-24 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-sage mb-3 tracking-widest uppercase">Статьи</p>
            <h2 className="font-display text-5xl font-light text-warm-brown">Наш блог</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <article key={post.id} className="group cursor-pointer">
                <div className="bg-cream rounded-xl aspect-video mb-4 flex items-center justify-center border border-border overflow-hidden relative group-hover:shadow-md transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-sage/20 to-gold/10" />
                  <span className="font-display text-5xl text-warm-brown/20 relative z-10">✝</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="text-xs border-sage/40 text-sage">{post.tag}</Badge>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-warm-brown transition-colors leading-tight">{post.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                <button className="mt-3 text-sm text-warm-brown font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Читать далее <Icon name="ArrowRight" size={14} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-warm-brown relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="font-display text-[300px] text-white leading-none select-none">✝</span>
        </div>
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-5xl font-light text-primary-foreground mb-4">Готовы начать путь?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">Разместите вакансию или резюме — и мы поможем найти то, что вы ищете.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={() => setVacModal(true)} className="bg-primary-foreground text-warm-brown hover:bg-primary-foreground/90 px-8 h-12 text-base font-semibold">Разместить вакансию</Button>
            <Button onClick={() => setResModal(true)} variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-8 h-12 text-base">Разместить резюме</Button>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="py-24 bg-cream/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-sage mb-3 tracking-widest uppercase">Связаться</p>
            <h2 className="font-display text-5xl font-light text-warm-brown">Контакты</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              {[{ icon: "Phone", label: "Телефон", value: "+7 (495) 123-45-67" }, { icon: "Mail", label: "Email", value: "info@blagodat-hr.ru" }, { icon: "MapPin", label: "Адрес", value: "Москва, ул. Тверская, д. 12, оф. 34" }, { icon: "Clock", label: "Режим работы", value: "Пн–Пт, 9:00–18:00" }].map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                    <Icon name={c.icon as "Phone"} size={18} className="text-sage" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{c.label}</p>
                    <p className="font-medium">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display text-2xl font-medium text-warm-brown mb-5">Написать нам</h3>
              {contactSuccess ? (
                <div className="text-center py-8">
                  <Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" />
                  <p className="text-foreground font-medium">{contactSuccess}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input placeholder="Ваше имя" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="bg-background" />
                  <Input placeholder="Email или телефон" value={contactForm.contact} onChange={(e) => setContactForm({ ...contactForm, contact: e.target.value })} className="bg-background" />
                  <textarea
                    placeholder="Ваше сообщение..."
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-body"
                  />
                  <Button onClick={handleContact} disabled={contactLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                    {contactLoading ? "Отправляем..." : "Отправить сообщение"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-warm-brown py-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl text-primary-foreground/80">✝</span>
              <span className="font-display text-xl font-semibold text-primary-foreground tracking-wide">Благодать</span>
            </div>
            <p className="font-display text-primary-foreground/60 text-sm italic text-center">«Всё, что делаете, делайте от души, как для Господа» — Кол. 3:23</p>
            <div className="flex gap-5 flex-wrap justify-center">
              {NAV_LINKS.map((link) => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors">{link.label}</button>
              ))}
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center">
            <p className="text-xs text-primary-foreground/40">© 2026 Благодать. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* Modal: Вакансия детально */}
      <Dialog open={!!selectedVacancy} onOpenChange={() => setSelectedVacancy(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-warm-brown">{selectedVacancy?.title}</DialogTitle>
          </DialogHeader>
          {selectedVacancy && (
            <div className="space-y-4">
              <p className="text-muted-foreground font-medium">{selectedVacancy.organization}</p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="MapPin" size={14} />{selectedVacancy.city}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="Clock" size={14} />{selectedVacancy.employment_type}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-warm-brown"><Icon name="Banknote" size={14} />{selectedVacancy.salary}</span>
              </div>
              {selectedVacancy.description && <div><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Описание</p><p className="text-sm leading-relaxed">{selectedVacancy.description}</p></div>}
              {selectedVacancy.requirements && <div><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Требования</p><p className="text-sm leading-relaxed">{selectedVacancy.requirements}</p></div>}
              <Button onClick={() => { setSelectedVacancy(null); setRespondVacancy(selectedVacancy); setFormError(""); setFormSuccess(""); setRespondModal(true); }} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                Откликнуться на вакансию
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Отклик на вакансию */}
      <Dialog open={respondModal} onOpenChange={setRespondModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-warm-brown">Откликнуться на вакансию</DialogTitle>
          </DialogHeader>
          {respondVacancy && <p className="text-sm text-muted-foreground -mt-2 mb-2">{respondVacancy.title} — {respondVacancy.organization}</p>}
          {formSuccess ? (
            <div className="text-center py-6"><Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" /><p className="font-medium">{formSuccess}</p></div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Ваше имя *" value={respondForm.name} onChange={(e) => setRespondForm({ ...respondForm, name: e.target.value })} />
              <Input placeholder="Email или телефон *" value={respondForm.contact} onChange={(e) => setRespondForm({ ...respondForm, contact: e.target.value })} />
              <textarea rows={3} placeholder="Сопроводительное письмо (необязательно)" value={respondForm.message} onChange={(e) => setRespondForm({ ...respondForm, message: e.target.value }) } className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleRespond} disabled={formLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {formLoading ? "Отправляем..." : "Отправить отклик"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Разместить вакансию */}
      <Dialog open={vacModal} onOpenChange={setVacModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-warm-brown">Разместить вакансию</DialogTitle>
          </DialogHeader>
          {formSuccess ? (
            <div className="text-center py-6"><Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" /><p className="font-medium">{formSuccess}</p></div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Название вакансии *" value={vacForm.title} onChange={(e) => setVacForm({ ...vacForm, title: e.target.value })} />
              <Input placeholder="Организация *" value={vacForm.organization} onChange={(e) => setVacForm({ ...vacForm, organization: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={vacForm.city || ""} onValueChange={(v) => setVacForm({ ...vacForm, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Город *" /></SelectTrigger>
                  <SelectContent>{CITIES.slice(1).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={vacForm.specialty || ""} onValueChange={(v) => setVacForm({ ...vacForm, specialty: v })}>
                  <SelectTrigger><SelectValue placeholder="Специальность *" /></SelectTrigger>
                  <SelectContent>{SPECS.slice(1).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Select value={vacForm.employment_type || ""} onValueChange={(v) => setVacForm({ ...vacForm, employment_type: v })}>
                <SelectTrigger><SelectValue placeholder="Тип занятости *" /></SelectTrigger>
                <SelectContent>
                  {["Полная занятость", "Частичная занятость", "Удалённо", "Гибкий график"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Зарплата от (₽)" type="number" value={vacForm.salary_from} onChange={(e) => setVacForm({ ...vacForm, salary_from: e.target.value })} />
                <Input placeholder="Зарплата до (₽)" type="number" value={vacForm.salary_to} onChange={(e) => setVacForm({ ...vacForm, salary_to: e.target.value })} />
              </div>
              <textarea rows={3} placeholder="Описание вакансии" value={vacForm.description} onChange={(e) => setVacForm({ ...vacForm, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <textarea rows={2} placeholder="Требования к кандидату" value={vacForm.requirements} onChange={(e) => setVacForm({ ...vacForm, requirements: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <Input placeholder="Email для откликов *" value={vacForm.contact_email} onChange={(e) => setVacForm({ ...vacForm, contact_email: e.target.value })} />
              <Input placeholder="Телефон" value={vacForm.contact_phone} onChange={(e) => setVacForm({ ...vacForm, contact_phone: e.target.value })} />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleCreateVacancy} disabled={formLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {formLoading ? "Размещаем..." : "Разместить вакансию"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Разместить резюме */}
      <Dialog open={resModal} onOpenChange={setResModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-warm-brown">Разместить резюме</DialogTitle>
          </DialogHeader>
          {formSuccess ? (
            <div className="text-center py-6"><Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" /><p className="font-medium">{formSuccess}</p></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Имя *" value={resForm.first_name} onChange={(e) => setResForm({ ...resForm, first_name: e.target.value })} />
                <Input placeholder="Фамилия *" value={resForm.last_name} onChange={(e) => setResForm({ ...resForm, last_name: e.target.value })} />
              </div>
              <Input placeholder="Должность / специализация *" value={resForm.title} onChange={(e) => setResForm({ ...resForm, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={resForm.city || ""} onValueChange={(v) => setResForm({ ...resForm, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Город *" /></SelectTrigger>
                  <SelectContent>{CITIES.slice(1).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={resForm.specialty || ""} onValueChange={(v) => setResForm({ ...resForm, specialty: v })}>
                  <SelectTrigger><SelectValue placeholder="Специальность *" /></SelectTrigger>
                  <SelectContent>{SPECS.slice(1).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Опыт (лет)" type="number" value={resForm.experience_years} onChange={(e) => setResForm({ ...resForm, experience_years: e.target.value })} />
                <Input placeholder="Желаемая зарплата (₽)" type="number" value={resForm.salary_from} onChange={(e) => setResForm({ ...resForm, salary_from: e.target.value })} />
              </div>
              <textarea rows={4} placeholder="О себе" value={resForm.about} onChange={(e) => setResForm({ ...resForm, about: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <Input placeholder="Email *" value={resForm.contact_email} onChange={(e) => setResForm({ ...resForm, contact_email: e.target.value })} />
              <Input placeholder="Телефон" value={resForm.contact_phone} onChange={(e) => setResForm({ ...resForm, contact_phone: e.target.value })} />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleCreateResume} disabled={formLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {formLoading ? "Размещаем..." : "Разместить резюме"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}