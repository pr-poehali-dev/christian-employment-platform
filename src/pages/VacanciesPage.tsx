import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, Vacancy } from "@/lib/api";

const SPECS = ["Образование", "Финансы", "Социальная сфера", "IT", "Психология", "Творчество", "Администрация", "Медицина", "Юриспруденция"];
const CITIES = ["Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Удалённо"];
const EMPLOYMENT_TYPES = ["Полная занятость", "Частичная занятость", "Удалённо", "Гибкий график"];
const SALARY_RANGES = [
  { label: "Любая", min: "", max: "" },
  { label: "до 50 000 ₽", min: "", max: "50000" },
  { label: "50 000 – 80 000 ₽", min: "50000", max: "80000" },
  { label: "80 000 – 120 000 ₽", min: "80000", max: "120000" },
  { label: "от 120 000 ₽", min: "120000", max: "" },
];
const SPEC_ICONS: Record<string, string> = {
  "Образование": "GraduationCap", "Финансы": "Banknote", "Социальная сфера": "Heart",
  "IT": "Monitor", "Психология": "Brain", "Творчество": "Music",
  "Администрация": "Building2", "Медицина": "Stethoscope", "Юриспруденция": "Scale",
};
const TAG_COLORS: Record<string, string> = {
  "Срочно": "bg-red-100 text-red-700 border-red-200",
  "Горячая": "bg-orange-100 text-orange-700 border-orange-200",
  "Новая": "bg-sage/20 text-sage border-sage/30",
};

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState(SALARY_RANGES[0]);
  const [selected, setSelected] = useState<Vacancy | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Form modals
  const [vacModal, setVacModal] = useState(false);
  const [respondModal, setRespondModal] = useState(false);
  const [respondVacancy, setRespondVacancy] = useState<Vacancy | null>(null);
  const [vacForm, setVacForm] = useState({ title: "", organization: "", city: "", specialty: "", employment_type: "", description: "", salary_from: "", salary_to: "", contact_email: "", contact_phone: "" });
  const [respondForm, setRespondForm] = useState({ name: "", contact: "", message: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.vacancies.list({
        specialty: selectedSpecs.length === 1 ? selectedSpecs[0] : "",
        city: selectedCities.length === 1 ? selectedCities[0] : "",
        salary_min: salaryRange.min,
        salary_max: salaryRange.max,
        search,
      });
      let items = data.vacancies;
      if (selectedSpecs.length > 1) items = items.filter(v => selectedSpecs.includes(v.specialty));
      if (selectedCities.length > 1) items = items.filter(v => selectedCities.includes(v.city));
      if (selectedTypes.length) items = items.filter(v => selectedTypes.includes(v.employment_type));
      if (sortBy === "salary_asc") items.sort((a, b) => (a.salary_from ?? 0) - (b.salary_from ?? 0));
      if (sortBy === "salary_desc") items.sort((a, b) => (b.salary_from ?? 0) - (a.salary_from ?? 0));
      setVacancies(items);
    } finally { setLoading(false); }
  }, [search, selectedSpecs, selectedCities, selectedTypes, salaryRange, sortBy]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => { setSelectedSpecs([]); setSelectedCities([]); setSelectedTypes([]); setSalaryRange(SALARY_RANGES[0]); setSearch(""); };
  const activeFiltersCount = selectedSpecs.length + selectedCities.length + selectedTypes.length + (salaryRange.min || salaryRange.max ? 1 : 0);

  const handleCreate = async () => {
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.vacancies.create({ ...vacForm, salary_from: vacForm.salary_from ? Number(vacForm.salary_from) : undefined, salary_to: vacForm.salary_to ? Number(vacForm.salary_to) : undefined } as Partial<Vacancy>);
      setFormSuccess("Вакансия размещена!"); load();
      setTimeout(() => { setVacModal(false); setFormSuccess(""); }, 2000);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setFormLoading(false); }
  };

  const handleRespond = async () => {
    if (!respondVacancy) return;
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.vacancies.respond({ vacancy_id: respondVacancy.id, ...respondForm });
      setFormSuccess("Отклик отправлен!"); setRespondForm({ name: "", contact: "", message: "" });
      setTimeout(() => { setRespondModal(false); setFormSuccess(""); }, 2000);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setFormLoading(false); }
  };

  const FilterSidebar = () => (
    <aside className="w-full">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Specialties */}
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Icon name="Briefcase" size={14} className="text-warm-brown" /> Специальность
          </h3>
          <div className="space-y-1.5">
            {SPECS.map(s => (
              <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedSpecs.includes(s) ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`}
                  onClick={() => toggleFilter(selectedSpecs, setSelectedSpecs, s)}>
                  {selectedSpecs.includes(s) && <Icon name="Check" size={10} className="text-primary-foreground" />}
                </div>
                <span className={`text-sm transition-colors ${selectedSpecs.includes(s) ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cities */}
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Icon name="MapPin" size={14} className="text-warm-brown" /> Город
          </h3>
          <div className="space-y-1.5">
            {CITIES.map(c => (
              <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedCities.includes(c) ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`}
                  onClick={() => toggleFilter(selectedCities, setSelectedCities, c)}>
                  {selectedCities.includes(c) && <Icon name="Check" size={10} className="text-primary-foreground" />}
                </div>
                <span className={`text-sm transition-colors ${selectedCities.includes(c) ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Employment type */}
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Icon name="Clock" size={14} className="text-warm-brown" /> Тип занятости
          </h3>
          <div className="space-y-1.5">
            {EMPLOYMENT_TYPES.map(t => (
              <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedTypes.includes(t) ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`}
                  onClick={() => toggleFilter(selectedTypes, setSelectedTypes, t)}>
                  {selectedTypes.includes(t) && <Icon name="Check" size={10} className="text-primary-foreground" />}
                </div>
                <span className={`text-sm transition-colors ${selectedTypes.includes(t) ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Salary */}
        <div className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Icon name="Banknote" size={14} className="text-warm-brown" /> Зарплата
          </h3>
          <div className="space-y-1.5">
            {SALARY_RANGES.map(r => (
              <label key={r.label} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${salaryRange.label === r.label ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`}
                  onClick={() => setSalaryRange(r)}>
                  {salaryRange.label === r.label && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
                <span className={`text-sm transition-colors ${salaryRange.label === r.label ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{r.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full mt-2 text-muted-foreground hover:text-red-500">
          <Icon name="X" size={14} className="mr-1" /> Сбросить фильтры ({activeFiltersCount})
        </Button>
      )}
    </aside>
  );

  return (
    <Layout onOpenVacancy={() => { setFormError(""); setFormSuccess(""); setVacModal(true); }}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-cream via-background to-light-sage/20 border-b border-border py-12">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-xs text-sage tracking-widest uppercase mb-2">Поиск работы</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-warm-brown mb-4">Вакансии</h1>
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Должность, организация или ключевое слово..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 h-12 text-base bg-card border-border shadow-sm"
              />
            </div>
          </div>

          {/* Quick spec tags */}
          <div className="flex flex-wrap gap-2 mt-5">
            {SPECS.map(s => (
              <button
                key={s}
                onClick={() => toggleFilter(selectedSpecs, setSelectedSpecs, s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedSpecs.includes(s)
                  ? "bg-warm-brown text-primary-foreground border-warm-brown shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-warm-brown/50 hover:text-warm-brown"}`}
              >
                <Icon name={SPEC_ICONS[s] as "Home" || "Briefcase"} size={12} />
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Найдено: <span className="font-semibold text-foreground">{vacancies.length}</span> вакансий
                </p>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-warm-brown/10 text-warm-brown border-warm-brown/20 text-xs">
                    {activeFiltersCount} фильтр{activeFiltersCount > 1 ? "а" : ""}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden flex items-center gap-2 text-sm text-warm-brown border border-warm-brown/30 rounded-lg px-3 py-1.5 hover:bg-warm-brown/5"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Icon name="SlidersHorizontal" size={14} /> Фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Сначала новые</SelectItem>
                    <SelectItem value="salary_desc">Зарплата ↓</SelectItem>
                    <SelectItem value="salary_asc">Зарплата ↑</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => { setFormError(""); setFormSuccess(""); setVacModal(true); }} size="sm" className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90 h-8 text-xs">
                  <Icon name="Plus" size={13} className="mr-1" /> Разместить
                </Button>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedSpecs.map(s => (
                  <span key={s} className="flex items-center gap-1.5 bg-warm-brown/10 text-warm-brown text-xs px-3 py-1 rounded-full">
                    {s}
                    <button onClick={() => toggleFilter(selectedSpecs, setSelectedSpecs, s)}><Icon name="X" size={10} /></button>
                  </span>
                ))}
                {selectedCities.map(c => (
                  <span key={c} className="flex items-center gap-1.5 bg-sage/10 text-sage text-xs px-3 py-1 rounded-full">
                    {c}
                    <button onClick={() => toggleFilter(selectedCities, setSelectedCities, c)}><Icon name="X" size={10} /></button>
                  </span>
                ))}
                {selectedTypes.map(t => (
                  <span key={t} className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                    {t}
                    <button onClick={() => toggleFilter(selectedTypes, setSelectedTypes, t)}><Icon name="X" size={10} /></button>
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Icon name="Loader" size={28} className="opacity-30 animate-spin" />
              </div>
            ) : vacancies.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-display text-2xl mb-2">Вакансий не найдено</p>
                <p className="text-sm mb-4">Попробуйте изменить фильтры или поисковый запрос</p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="border-warm-brown text-warm-brown">Сбросить фильтры</Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {vacancies.map(v => (
                  <div
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-warm-brown/30 transition-all cursor-pointer group"
                  >
                    <div className="flex gap-4">
                      {/* Logo placeholder */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cream to-light-sage flex items-center justify-center flex-shrink-0 border border-border">
                        <Icon name={(SPEC_ICONS[v.specialty] || "Briefcase") as "Home"} size={20} className="text-warm-brown/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className="font-semibold text-foreground group-hover:text-warm-brown transition-colors">{v.title}</h3>
                              {v.tag && <Badge className={`text-xs ${TAG_COLORS[v.tag] || ""}`} variant="outline">{v.tag}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{v.organization}</p>
                          </div>
                          <p className="font-semibold text-warm-brown text-sm whitespace-nowrap">{v.salary}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MapPin" size={11} />{v.city}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Clock" size={11} />{v.employment_type}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Tag" size={11} />{v.specialty}</span>
                        </div>
                      </div>
                    </div>
                    {v.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2 pl-16">{v.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pl-16">
                      <span className="text-xs text-muted-foreground/70">
                        {new Date(v.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                      </span>
                      <Button
                        size="sm"
                        onClick={e => { e.stopPropagation(); setRespondVacancy(v); setFormError(""); setFormSuccess(""); setRespondModal(true); }}
                        className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90 h-7 px-4 text-xs"
                      >
                        Откликнуться
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-background overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Фильтры</h2>
              <button onClick={() => setSidebarOpen(false)}><Icon name="X" size={20} /></button>
            </div>
            <FilterSidebar />
            <Button onClick={() => setSidebarOpen(false)} className="w-full mt-4 bg-warm-brown text-primary-foreground">
              Показать результаты
            </Button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cream to-light-sage flex items-center justify-center flex-shrink-0 border border-border">
                <Icon name={(SPEC_ICONS[selected?.specialty || ""] || "Briefcase") as "Home"} size={20} className="text-warm-brown/60" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl text-warm-brown">{selected?.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{selected?.organization}</p>
              </div>
            </div>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-sage/40 text-sage text-xs"><Icon name="Tag" size={10} className="mr-1" />{selected.specialty}</Badge>
                <Badge variant="outline" className="text-xs"><Icon name="MapPin" size={10} className="mr-1" />{selected.city}</Badge>
                <Badge variant="outline" className="text-xs"><Icon name="Clock" size={10} className="mr-1" />{selected.employment_type}</Badge>
              </div>
              <div className="bg-warm-brown/5 rounded-xl p-3 border border-warm-brown/10">
                <p className="text-warm-brown font-semibold text-lg">{selected.salary}</p>
              </div>
              {selected.description && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Описание</p>
                  <p className="text-sm leading-relaxed">{selected.description}</p>
                </div>
              )}
              {selected.requirements && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Требования</p>
                  <p className="text-sm leading-relaxed">{selected.requirements}</p>
                </div>
              )}
              <Button onClick={() => { setSelected(null); setRespondVacancy(selected); setFormError(""); setFormSuccess(""); setRespondModal(true); }} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                Откликнуться на вакансию
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Respond modal */}
      <Dialog open={respondModal} onOpenChange={setRespondModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-xl text-warm-brown">Отклик на вакансию</DialogTitle></DialogHeader>
          {respondVacancy && <p className="text-sm text-muted-foreground -mt-2 mb-3">{respondVacancy.title} — {respondVacancy.organization}</p>}
          {formSuccess ? (
            <div className="text-center py-6"><Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" /><p className="font-medium">{formSuccess}</p></div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Ваше имя *" value={respondForm.name} onChange={e => setRespondForm({ ...respondForm, name: e.target.value })} />
              <Input placeholder="Email или телефон *" value={respondForm.contact} onChange={e => setRespondForm({ ...respondForm, contact: e.target.value })} />
              <textarea rows={3} placeholder="Сопроводительное письмо" value={respondForm.message} onChange={e => setRespondForm({ ...respondForm, message: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleRespond} disabled={formLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {formLoading ? "Отправляем..." : "Отправить отклик"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create vacancy modal */}
      <Dialog open={vacModal} onOpenChange={setVacModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl text-warm-brown">Разместить вакансию</DialogTitle></DialogHeader>
          {formSuccess ? (
            <div className="text-center py-6"><Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" /><p className="font-medium">{formSuccess}</p></div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Название *" value={vacForm.title} onChange={e => setVacForm({ ...vacForm, title: e.target.value })} />
              <Input placeholder="Организация *" value={vacForm.organization} onChange={e => setVacForm({ ...vacForm, organization: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={vacForm.city} onValueChange={v => setVacForm({ ...vacForm, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Город *" /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={vacForm.specialty} onValueChange={v => setVacForm({ ...vacForm, specialty: v })}>
                  <SelectTrigger><SelectValue placeholder="Специальность *" /></SelectTrigger>
                  <SelectContent>{SPECS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Select value={vacForm.employment_type} onValueChange={v => setVacForm({ ...vacForm, employment_type: v })}>
                <SelectTrigger><SelectValue placeholder="Тип занятости *" /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Зарплата от (₽)" value={vacForm.salary_from} onChange={e => setVacForm({ ...vacForm, salary_from: e.target.value })} />
                <Input type="number" placeholder="Зарплата до (₽)" value={vacForm.salary_to} onChange={e => setVacForm({ ...vacForm, salary_to: e.target.value })} />
              </div>
              <textarea rows={3} placeholder="Описание" value={vacForm.description} onChange={e => setVacForm({ ...vacForm, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <textarea rows={2} placeholder="Требования" value={vacForm.requirements} onChange={e => setVacForm({ ...vacForm, requirements: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <Input placeholder="Email для откликов *" value={vacForm.contact_email} onChange={e => setVacForm({ ...vacForm, contact_email: e.target.value })} />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleCreate} disabled={formLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {formLoading ? "Размещаем..." : "Разместить вакансию"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
