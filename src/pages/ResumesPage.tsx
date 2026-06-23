import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, Resume } from "@/lib/api";

const SPECS = ["Образование", "Финансы", "Социальная сфера", "IT", "Психология", "Творчество", "Администрация", "Медицина", "Юриспруденция"];
const CITIES = ["Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Удалённо"];
const EXP_RANGES = ["Без опыта", "1–3 года", "3–6 лет", "Более 6 лет"];
const SALARY_RANGES = [
  { label: "Любая", min: "" },
  { label: "от 30 000 ₽", min: "30000" },
  { label: "от 50 000 ₽", min: "50000" },
  { label: "от 80 000 ₽", min: "80000" },
  { label: "от 120 000 ₽", min: "120000" },
];
const SPEC_ICONS: Record<string, string> = {
  "Образование": "GraduationCap", "Финансы": "Banknote", "Социальная сфера": "Heart",
  "IT": "Monitor", "Психология": "Brain", "Творчество": "Music",
  "Администрация": "Building2", "Медицина": "Stethoscope", "Юриспруденция": "Scale",
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState(SALARY_RANGES[0]);
  const [selectedExp, setSelectedExp] = useState<string[]>([]);
  const [selected, setSelected] = useState<Resume | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [resModal, setResModal] = useState(false);
  const [resForm, setResForm] = useState({ first_name: "", last_name: "", title: "", city: "", specialty: "", experience_years: "", salary_from: "", about: "", contact_email: "", contact_phone: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const filterByExp = (exp: number, sel: string[]) => {
    if (!sel.length) return true;
    for (const s of sel) {
      if (s === "Без опыта" && exp === 0) return true;
      if (s === "1–3 года" && exp >= 1 && exp < 3) return true;
      if (s === "3–6 лет" && exp >= 3 && exp < 6) return true;
      if (s === "Более 6 лет" && exp >= 6) return true;
    }
    return false;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.resumes.list({
        specialty: selectedSpecs.length === 1 ? selectedSpecs[0] : "",
        city: selectedCities.length === 1 ? selectedCities[0] : "",
        salary_min: salaryRange.min,
        search,
      });
      let items = data.resumes;
      if (selectedSpecs.length > 1) items = items.filter(r => selectedSpecs.includes(r.specialty));
      if (selectedCities.length > 1) items = items.filter(r => selectedCities.includes(r.city));
      if (selectedExp.length) items = items.filter(r => filterByExp(r.experience_years, selectedExp));
      setResumes(items);
    } finally { setLoading(false); }
  }, [search, selectedSpecs, selectedCities, salaryRange, selectedExp]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => { setSelectedSpecs([]); setSelectedCities([]); setSalaryRange(SALARY_RANGES[0]); setSelectedExp([]); setSearch(""); };
  const activeFiltersCount = selectedSpecs.length + selectedCities.length + selectedExp.length + (salaryRange.min ? 1 : 0);

  const handleCreate = async () => {
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.resumes.create({ ...resForm, salary_from: resForm.salary_from ? Number(resForm.salary_from) : undefined, experience_years: resForm.experience_years ? Number(resForm.experience_years) : 0 });
      setFormSuccess("Резюме размещено!"); load();
      setTimeout(() => { setResModal(false); setFormSuccess(""); }, 2000);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setFormLoading(false); }
  };

  const FilterSidebar = () => (
    <aside className="w-full">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icon name="Briefcase" size={14} className="text-warm-brown" />Специальность</h3>
          <div className="space-y-1.5">
            {SPECS.map(s => (
              <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedSpecs.includes(s) ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`} onClick={() => toggleFilter(selectedSpecs, setSelectedSpecs, s)}>
                  {selectedSpecs.includes(s) && <Icon name="Check" size={10} className="text-primary-foreground" />}
                </div>
                <span className={`text-sm ${selectedSpecs.includes(s) ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icon name="MapPin" size={14} className="text-warm-brown" />Город</h3>
          <div className="space-y-1.5">
            {CITIES.map(c => (
              <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedCities.includes(c) ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`} onClick={() => toggleFilter(selectedCities, setSelectedCities, c)}>
                  {selectedCities.includes(c) && <Icon name="Check" size={10} className="text-primary-foreground" />}
                </div>
                <span className={`text-sm ${selectedCities.includes(c) ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{c}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icon name="Clock" size={14} className="text-warm-brown" />Опыт работы</h3>
          <div className="space-y-1.5">
            {EXP_RANGES.map(e => (
              <label key={e} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedExp.includes(e) ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`} onClick={() => toggleFilter(selectedExp, setSelectedExp, e)}>
                  {selectedExp.includes(e) && <Icon name="Check" size={10} className="text-primary-foreground" />}
                </div>
                <span className={`text-sm ${selectedExp.includes(e) ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{e}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icon name="Banknote" size={14} className="text-warm-brown" />Желаемая зарплата</h3>
          <div className="space-y-1.5">
            {SALARY_RANGES.map(r => (
              <label key={r.label} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${salaryRange.label === r.label ? "bg-warm-brown border-warm-brown" : "border-border group-hover:border-warm-brown/50"}`} onClick={() => setSalaryRange(r)}>
                  {salaryRange.label === r.label && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
                <span className={`text-sm ${salaryRange.label === r.label ? "text-warm-brown font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>{r.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full mt-2 text-muted-foreground hover:text-red-500">
          <Icon name="X" size={14} className="mr-1" />Сбросить ({activeFiltersCount})
        </Button>
      )}
    </aside>
  );

  return (
    <Layout onOpenResume={() => { setFormError(""); setFormSuccess(""); setResModal(true); }}>
      <div className="bg-gradient-to-br from-light-sage/20 via-background to-cream border-b border-border py-12">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-xs text-sage tracking-widest uppercase mb-2">Поиск сотрудников</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-warm-brown mb-4">База резюме</h1>
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Имя, должность или специальность..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-12 text-base bg-card border-border shadow-sm" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            {SPECS.map(s => (
              <button key={s} onClick={() => toggleFilter(selectedSpecs, setSelectedSpecs, s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedSpecs.includes(s) ? "bg-warm-brown text-primary-foreground border-warm-brown shadow-sm" : "bg-card text-muted-foreground border-border hover:border-warm-brown/50 hover:text-warm-brown"}`}>
                <Icon name={(SPEC_ICONS[s] || "Briefcase") as "Home"} size={12} />{s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24"><FilterSidebar /></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Найдено: <span className="font-semibold text-foreground">{resumes.length}</span> резюме</p>
                {activeFiltersCount > 0 && <Badge className="bg-warm-brown/10 text-warm-brown border-warm-brown/20 text-xs">{activeFiltersCount} фильтра</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <button className="lg:hidden flex items-center gap-2 text-sm text-warm-brown border border-warm-brown/30 rounded-lg px-3 py-1.5" onClick={() => setSidebarOpen(true)}>
                  <Icon name="SlidersHorizontal" size={14} />Фильтры
                </button>
                <Button onClick={() => { setFormError(""); setFormSuccess(""); setResModal(true); }} size="sm" className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90 h-8 text-xs">
                  <Icon name="Plus" size={13} className="mr-1" />Разместить резюме
                </Button>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedSpecs.map(s => <span key={s} className="flex items-center gap-1.5 bg-warm-brown/10 text-warm-brown text-xs px-3 py-1 rounded-full">{s}<button onClick={() => toggleFilter(selectedSpecs, setSelectedSpecs, s)}><Icon name="X" size={10} /></button></span>)}
                {selectedCities.map(c => <span key={c} className="flex items-center gap-1.5 bg-sage/10 text-sage text-xs px-3 py-1 rounded-full">{c}<button onClick={() => toggleFilter(selectedCities, setSelectedCities, c)}><Icon name="X" size={10} /></button></span>)}
                {selectedExp.map(e => <span key={e} className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">{e}<button onClick={() => toggleFilter(selectedExp, setSelectedExp, e)}><Icon name="X" size={10} /></button></span>)}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-24"><Icon name="Loader" size={28} className="opacity-30 animate-spin" /></div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-display text-2xl mb-2">Резюме не найдено</p>
                {activeFiltersCount > 0 && <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 border-warm-brown text-warm-brown">Сбросить фильтры</Button>}
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map(r => (
                  <div key={r.id} onClick={() => setSelected(r)} className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-warm-brown/30 transition-all cursor-pointer group">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage/30 to-gold/20 flex items-center justify-center flex-shrink-0 border border-border">
                        <span className="font-display font-semibold text-warm-brown">{(r.first_name?.[0] || "")}{(r.last_name?.[0] || "")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold group-hover:text-warm-brown transition-colors">{r.name}</h3>
                            <p className="text-sm text-muted-foreground">{r.title}</p>
                          </div>
                          <p className="font-semibold text-warm-brown text-sm whitespace-nowrap">{r.salary}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MapPin" size={11} />{r.city}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Tag" size={11} />{r.specialty}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Clock" size={11} />{r.exp}</span>
                        </div>
                      </div>
                    </div>
                    {r.about && <p className="text-sm text-muted-foreground mt-3 line-clamp-2 pl-16">{r.about}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-background overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Фильтры</h2>
              <button onClick={() => setSidebarOpen(false)}><Icon name="X" size={20} /></button>
            </div>
            <FilterSidebar />
            <Button onClick={() => setSidebarOpen(false)} className="w-full mt-4 bg-warm-brown text-primary-foreground">Показать результаты</Button>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sage/30 to-gold/20 flex items-center justify-center border border-border">
                <span className="font-display font-semibold text-warm-brown text-xl">{(selected?.first_name?.[0] || "")}{(selected?.last_name?.[0] || "")}</span>
              </div>
              <div>
                <DialogTitle className="font-display text-xl text-warm-brown">{selected?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selected?.title}</p>
              </div>
            </div>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-sage/40 text-sage text-xs"><Icon name="Tag" size={10} className="mr-1" />{selected.specialty}</Badge>
                <Badge variant="outline" className="text-xs"><Icon name="MapPin" size={10} className="mr-1" />{selected.city}</Badge>
                <Badge variant="outline" className="text-xs"><Icon name="Clock" size={10} className="mr-1" />{selected.exp}</Badge>
              </div>
              <div className="bg-warm-brown/5 rounded-xl p-3 border border-warm-brown/10">
                <p className="text-warm-brown font-semibold text-lg">{selected.salary}</p>
              </div>
              {selected.about && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">О себе</p><p className="text-sm leading-relaxed">{selected.about}</p></div>}
              {selected.skills && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Навыки</p><p className="text-sm leading-relaxed">{selected.skills}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resModal} onOpenChange={setResModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl text-warm-brown">Разместить резюме</DialogTitle></DialogHeader>
          {formSuccess ? (
            <div className="text-center py-6"><Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" /><p className="font-medium">{formSuccess}</p></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Имя *" value={resForm.first_name} onChange={e => setResForm({ ...resForm, first_name: e.target.value })} />
                <Input placeholder="Фамилия *" value={resForm.last_name} onChange={e => setResForm({ ...resForm, last_name: e.target.value })} />
              </div>
              <Input placeholder="Должность *" value={resForm.title} onChange={e => setResForm({ ...resForm, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={resForm.city} onValueChange={v => setResForm({ ...resForm, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Город *" /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={resForm.specialty} onValueChange={v => setResForm({ ...resForm, specialty: v })}>
                  <SelectTrigger><SelectValue placeholder="Специальность *" /></SelectTrigger>
                  <SelectContent>{SPECS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Опыт (лет)" value={resForm.experience_years} onChange={e => setResForm({ ...resForm, experience_years: e.target.value })} />
                <Input type="number" placeholder="Зарплата от (₽)" value={resForm.salary_from} onChange={e => setResForm({ ...resForm, salary_from: e.target.value })} />
              </div>
              <textarea rows={4} placeholder="О себе" value={resForm.about} onChange={e => setResForm({ ...resForm, about: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <Input placeholder="Email *" value={resForm.contact_email} onChange={e => setResForm({ ...resForm, contact_email: e.target.value })} />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleCreate} disabled={formLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {formLoading ? "Размещаем..." : "Разместить резюме"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
