import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const VACANCIES = [
  { id: 1, title: "Директор воскресной школы", org: "Церковь «Благодать»", city: "Москва", salary: "60 000 – 80 000 ₽", spec: "Образование", type: "Полная занятость", tag: "Новая" },
  { id: 2, title: "Бухгалтер", org: "Христианский фонд «Свет»", city: "Санкт-Петербург", salary: "70 000 – 90 000 ₽", spec: "Финансы", type: "Полная занятость", tag: "" },
  { id: 3, title: "Социальный работник", org: "Миссия «Надежда»", city: "Екатеринбург", salary: "45 000 – 55 000 ₽", spec: "Социальная сфера", type: "Частичная занятость", tag: "Срочно" },
  { id: 4, title: "Музыкальный руководитель", org: "Молодёжная церковь", city: "Казань", salary: "40 000 – 60 000 ₽", spec: "Творчество", type: "Частичная занятость", tag: "" },
  { id: 5, title: "IT-специалист", org: "Христианское издательство", city: "Новосибирск", salary: "90 000 – 120 000 ₽", spec: "IT", type: "Удалённо", tag: "Горячая" },
  { id: 6, title: "Психолог-консультант", org: "Центр помощи семье", city: "Москва", salary: "55 000 – 75 000 ₽", spec: "Психология", type: "Гибкий график", tag: "" },
];

const RESUMES = [
  { id: 1, name: "Анна Петрова", title: "Педагог начальных классов", city: "Москва", salary: "от 55 000 ₽", spec: "Образование", exp: "8 лет опыта" },
  { id: 2, name: "Михаил Соколов", title: "Финансовый директор", city: "Санкт-Петербург", salary: "от 100 000 ₽", spec: "Финансы", exp: "12 лет опыта" },
  { id: 3, name: "Елена Козлова", title: "Социальный педагог", city: "Екатеринбург", salary: "от 40 000 ₽", spec: "Социальная сфера", exp: "5 лет опыта" },
  { id: 4, name: "Дмитрий Волков", title: "Fullstack-разработчик", city: "Удалённо", salary: "от 120 000 ₽", spec: "IT", exp: "7 лет опыта" },
  { id: 5, name: "Ольга Морозова", title: "Клинический психолог", city: "Москва", salary: "от 65 000 ₽", spec: "Психология", exp: "10 лет опыта" },
  { id: 6, name: "Сергей Новиков", title: "Хоровой дирижёр", city: "Казань", salary: "от 50 000 ₽", spec: "Творчество", exp: "15 лет опыта" },
];

const BLOG_POSTS = [
  { id: 1, date: "12 мая 2026", title: "Как найти призвание в работе?", excerpt: "О том, как христианские ценности помогают выстраивать профессиональный путь с внутренним миром.", tag: "Призвание" },
  { id: 2, date: "5 мая 2026", title: "Честность на собеседовании", excerpt: "Почему честность — не слабость, а сила. Как говорить о себе правду и оставаться собой.", tag: "Советы" },
  { id: 3, date: "28 апреля 2026", title: "Служение через профессию", excerpt: "Каждая профессия может стать служением. История нескольких наших соискателей.", tag: "Истории" },
];

const SPECS = ["Все специальности", "Образование", "Финансы", "Социальная сфера", "IT", "Психология", "Творчество"];
const CITIES = ["Все города", "Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Удалённо"];
const SALARY_RANGES = ["Любая зарплата", "до 50 000 ₽", "50 000 – 80 000 ₽", "80 000 – 120 000 ₽", "от 120 000 ₽"];

export default function Index() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [vacSpec, setVacSpec] = useState("Все специальности");
  const [vacCity, setVacCity] = useState("Все города");
  const [vacSalary, setVacSalary] = useState("Любая зарплата");
  const [vacSearch, setVacSearch] = useState("");

  const [resSpec, setResSpec] = useState("Все специальности");
  const [resCity, setResCity] = useState("Все города");
  const [resSalary, setResSalary] = useState("Любая зарплата");
  const [resSearch, setResSearch] = useState("");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filterVacancies = () => {
    return VACANCIES.filter((v) => {
      const matchSpec = vacSpec === "Все специальности" || v.spec === vacSpec;
      const matchCity = vacCity === "Все города" || v.city === vacCity;
      const matchSearch = !vacSearch || v.title.toLowerCase().includes(vacSearch.toLowerCase()) || v.org.toLowerCase().includes(vacSearch.toLowerCase());
      return matchSpec && matchCity && matchSearch;
    });
  };

  const filterResumes = () => {
    return RESUMES.filter((r) => {
      const matchSpec = resSpec === "Все специальности" || r.spec === resSpec;
      const matchCity = resCity === "Все города" || r.city === resCity;
      const matchSearch = !resSearch || r.name.toLowerCase().includes(resSearch.toLowerCase()) || r.title.toLowerCase().includes(resSearch.toLowerCase());
      return matchSpec && matchCity && matchSearch;
    });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("home")} className="flex items-center gap-2 group">
            <span className="text-2xl">✝</span>
            <span className="font-display text-xl font-semibold text-warm-brown tracking-wide">Благодать</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`text-sm font-body transition-colors hover:text-warm-brown ${
                  activeSection === link.id ? "text-warm-brown font-semibold" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground">
              Разместить вакансию
            </Button>
            <Button size="sm" className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
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
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="block w-full text-left py-3 text-sm border-b border-border last:border-0 text-foreground hover:text-warm-brown"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="outline" size="sm" className="border-warm-brown text-warm-brown">Разместить вакансию</Button>
              <Button size="sm" className="bg-warm-brown text-primary-foreground">Разместить резюме</Button>
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
            <p className="text-sm font-body text-sage mb-4 tracking-widest uppercase animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
              Христианское кадровое агентство
            </p>
            <h1 className="font-display text-6xl md:text-7xl font-light text-warm-brown leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
              Найди своё
              <br />
              <em className="font-medium">призвание</em>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 animate-fade-in max-w-lg" style={{ animationDelay: "0.3s", opacity: 0 }}>
              Помогаем людям с христианскими ценностями находить достойную работу и надёжных сотрудников. Вакансии и резюме от проверенных работодателей.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
              <Button onClick={() => scrollTo("vacancies")} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90 px-8 h-12 text-base">
                Смотреть вакансии
              </Button>
              <Button variant="outline" onClick={() => scrollTo("resumes")} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground px-8 h-12 text-base">
                Найти сотрудника
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-20 max-w-lg">
            {[
              { num: "250+", label: "Вакансий" },
              { num: "180+", label: "Резюме" },
              { num: "95%", label: "Успешных трудоустройств" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-4xl font-semibold text-warm-brown">{stat.num}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
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
              <p className="text-sm font-body text-sage mb-3 tracking-widest uppercase">О нас</p>
              <h2 className="font-display text-5xl font-light text-warm-brown leading-tight mb-6">
                Мы верим в силу<br /><em>доверия и служения</em>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                «Благодать» — это кадровое агентство, созданное верующими для верующих. Мы убеждены, что работа — это не просто источник дохода, а возможность служить Богу и людям.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Мы тщательно проверяем каждого работодателя и кандидата, обеспечивая безопасную и честную среду для поиска работы в соответствии с христианскими принципами.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "Heart", text: "Христианские ценности" },
                  { icon: "Shield", text: "Проверенные работодатели" },
                  { icon: "Users", text: "Личный подход" },
                  { icon: "BookOpen", text: "Духовная поддержка" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon as "Heart"} size={16} className="text-sage" />
                    </div>
                    <span className="text-sm text-foreground">{item.text}</span>
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
                <Input placeholder="Поиск по вакансиям..." value={vacSearch} onChange={(e) => setVacSearch(e.target.value)} className="pl-9 bg-background" />
              </div>
              <Select value={vacSpec} onValueChange={setVacSpec}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{SPECS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={vacCity} onValueChange={setVacCity}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={vacSalary} onValueChange={setVacSalary}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{SALARY_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filterVacancies().map((v) => (
              <div key={v.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-light-sage flex items-center justify-center">
                    <span className="text-lg">✝</span>
                  </div>
                  {v.tag && (
                    <Badge className={`text-xs font-body ${v.tag === "Срочно" ? "bg-red-100 text-red-700 border-red-200" : v.tag === "Горячая" ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-sage/20 text-sage border-sage/30"}`} variant="outline">
                      {v.tag}
                    </Badge>
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-warm-brown transition-colors">{v.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{v.org}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MapPin" size={12} /> {v.city}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Clock" size={12} /> {v.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body font-semibold text-warm-brown text-sm">{v.salary}</span>
                  <Button size="sm" variant="ghost" className="text-warm-brown hover:bg-warm-brown/10 h-7 px-3 text-xs">Откликнуться</Button>
                </div>
              </div>
            ))}
          </div>

          {filterVacancies().length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-xl">Вакансий не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Button variant="outline" className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground px-8">
              Показать все вакансии
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
                <Input placeholder="Поиск по резюме..." value={resSearch} onChange={(e) => setResSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={resSpec} onValueChange={setResSpec}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SPECS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={resCity} onValueChange={setResCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={resSalary} onValueChange={setResSalary}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SALARY_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filterResumes().map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage/30 to-gold/30 flex items-center justify-center">
                    <span className="font-display font-semibold text-warm-brown text-lg">
                      {r.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-foreground group-hover:text-warm-brown transition-colors">{r.name}</h3>
                    <p className="text-xs text-sage">{r.exp}</p>
                  </div>
                </div>
                <p className="font-display text-base font-medium text-foreground mb-3">{r.title}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MapPin" size={12} /> {r.city}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Briefcase" size={12} /> {r.spec}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body font-semibold text-warm-brown text-sm">{r.salary}</span>
                  <Button size="sm" variant="ghost" className="text-warm-brown hover:bg-warm-brown/10 h-7 px-3 text-xs">Просмотреть</Button>
                </div>
              </div>
            ))}
          </div>

          {filterResumes().length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-display text-xl">Резюме не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Button variant="outline" className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground px-8">
              Показать все резюме
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
                  <Badge variant="outline" className="text-xs border-sage/40 text-sage font-body">{post.tag}</Badge>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-warm-brown transition-colors leading-tight">{post.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                <button className="mt-3 text-sm text-warm-brown font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Читать далее <Icon name="ArrowRight" size={14} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-warm-brown relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="font-display text-[300px] text-white leading-none select-none">✝</span>
        </div>
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-5xl font-light text-primary-foreground mb-4">Готовы начать путь?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
            Разместите вакансию или резюме — и мы поможем вам найти то, что вы ищете, с Божьей помощью.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button className="bg-primary-foreground text-warm-brown hover:bg-primary-foreground/90 px-8 h-12 text-base font-semibold">
              Разместить вакансию
            </Button>
            <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-8 h-12 text-base">
              Разместить резюме
            </Button>
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
              {[
                { icon: "Phone", label: "Телефон", value: "+7 (495) 123-45-67" },
                { icon: "Mail", label: "Email", value: "info@blagodat-hr.ru" },
                { icon: "MapPin", label: "Адрес", value: "Москва, ул. Тверская, д. 12, оф. 34" },
                { icon: "Clock", label: "Режим работы", value: "Пн–Пт, 9:00–18:00" },
              ].map((contact) => (
                <div key={contact.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                    <Icon name={contact.icon as "Phone"} size={18} className="text-sage" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{contact.label}</p>
                    <p className="font-body font-medium text-foreground">{contact.value}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">Мы в социальных сетях:</p>
                <div className="flex gap-3">
                  {[{ icon: "MessageCircle", label: "Telegram" }, { icon: "Users", label: "ВКонтакте" }].map((soc) => (
                    <Button key={soc.label} variant="outline" size="sm" className="border-border text-muted-foreground hover:border-warm-brown hover:text-warm-brown">
                      <Icon name={soc.icon as "Users"} size={14} className="mr-1" />
                      {soc.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-display text-2xl font-medium text-warm-brown mb-5">Написать нам</h3>
              <div className="space-y-4">
                <Input placeholder="Ваше имя" className="bg-background" />
                <Input placeholder="Email или телефон" className="bg-background" />
                <textarea
                  placeholder="Ваше сообщение..."
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-body"
                />
                <Button className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                  Отправить сообщение
                </Button>
              </div>
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
            <p className="font-display text-primary-foreground/60 text-sm italic text-center">
              «Всё, что делаете, делайте от души, как для Господа» — Кол. 3:23
            </p>
            <div className="flex gap-5 flex-wrap justify-center">
              {NAV_LINKS.map((link) => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors">
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
