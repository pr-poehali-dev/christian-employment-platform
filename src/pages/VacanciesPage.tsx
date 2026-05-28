import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, Vacancy } from "@/lib/api";

const SPECS = ["Все специальности", "Образование", "Финансы", "Социальная сфера", "IT", "Психология", "Творчество"];
const CITIES = ["Все города", "Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Удалённо"];
const SALARY_RANGES = [
  { label: "Любая зарплата", min: "", max: "" },
  { label: "до 50 000 ₽", min: "", max: "50000" },
  { label: "50 000 – 80 000 ₽", min: "50000", max: "80000" },
  { label: "80 000 – 120 000 ₽", min: "80000", max: "120000" },
  { label: "от 120 000 ₽", min: "120000", max: "" },
];
const TAG_COLORS: Record<string, string> = {
  "Срочно": "bg-red-100 text-red-700 border-red-200",
  "Горячая": "bg-orange-100 text-orange-700 border-orange-200",
  "Новая": "bg-sage/20 text-sage border-sage/30",
};

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState("Все специальности");
  const [city, setCity] = useState("Все города");
  const [salaryLabel, setSalaryLabel] = useState("Любая зарплата");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vacancy | null>(null);

  const [vacModal, setVacModal] = useState(false);
  const [respondModal, setRespondModal] = useState(false);
  const [respondVacancy, setRespondVacancy] = useState<Vacancy | null>(null);
  const [vacForm, setVacForm] = useState({ title: "", organization: "", city: "", specialty: "", employment_type: "", description: "", salary_from: "", salary_to: "", contact_email: "", contact_phone: "" });
  const [respondForm, setRespondForm] = useState({ name: "", contact: "", message: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = SALARY_RANGES.find(r => r.label === salaryLabel) || SALARY_RANGES[0];
      const data = await api.vacancies.list({
        specialty: spec === "Все специальности" ? "" : spec,
        city: city === "Все города" ? "" : city,
        salary_min: range.min,
        salary_max: range.max,
        search,
      });
      setVacancies(data.vacancies);
    } finally {
      setLoading(false);
    }
  }, [spec, city, salaryLabel, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.vacancies.create({ ...vacForm, salary_from: vacForm.salary_from ? Number(vacForm.salary_from) : undefined, salary_to: vacForm.salary_to ? Number(vacForm.salary_to) : undefined } as Partial<Vacancy>);
      setFormSuccess("Вакансия размещена!");
      load();
      setTimeout(() => { setVacModal(false); setFormSuccess(""); }, 2000);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setFormLoading(false); }
  };

  const handleRespond = async () => {
    if (!respondVacancy) return;
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.vacancies.respond({ vacancy_id: respondVacancy.id, ...respondForm });
      setFormSuccess("Отклик отправлен!");
      setTimeout(() => { setRespondModal(false); setFormSuccess(""); }, 2000);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setFormLoading(false); }
  };

  return (
    <Layout onOpenVacancy={() => { setFormError(""); setFormSuccess(""); setVacModal(true); }}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-cream to-light-sage/30 py-16 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4">
          <p className="text-sm text-sage mb-2 tracking-widest uppercase">Поиск работы</p>
          <h1 className="font-display text-5xl font-light text-warm-brown mb-3">Вакансии</h1>
          <p className="text-muted-foreground max-w-xl">Работа в христианских организациях — от образования до IT. Все работодатели проверены.</p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="bg-cream rounded-2xl p-5 mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background" />
            </div>
            <Select value={spec} onValueChange={setSpec}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>{SPECS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={salaryLabel} onValueChange={setSalaryLabel}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>{SALARY_RANGES.map(r => <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">Найдено: <span className="font-semibold text-foreground">{vacancies.length}</span> вакансий</p>
          <Button onClick={() => { setFormError(""); setFormSuccess(""); setVacModal(true); }} size="sm" className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
            <Icon name="Plus" size={14} className="mr-1" /> Разместить вакансию
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20"><Icon name="Loader" size={32} className="mx-auto mb-3 opacity-30 animate-spin" /></div>
        ) : vacancies.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-display text-2xl mb-1">Ничего не найдено</p>
            <p className="text-sm">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vacancies.map(v => (
              <div key={v.id} onClick={() => setSelected(v)} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-light-sage flex items-center justify-center text-lg">✝</div>
                  {v.tag && <Badge className={`text-xs ${TAG_COLORS[v.tag] || "bg-sage/20 text-sage border-sage/30"}`} variant="outline">{v.tag}</Badge>}
                </div>
                <h3 className="font-display text-lg font-semibold mb-1 group-hover:text-warm-brown transition-colors">{v.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{v.organization}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="MapPin" size={12} />{v.city}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="Clock" size={12} />{v.employment_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-warm-brown text-sm">{v.salary}</span>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setRespondVacancy(v); setFormError(""); setFormSuccess(""); setRespondModal(true); }} className="text-warm-brown hover:bg-warm-brown/10 h-7 px-3 text-xs">
                    Откликнуться
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl text-warm-brown">{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-muted-foreground font-medium">{selected.organization}</p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="MapPin" size={14} />{selected.city}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="Clock" size={14} />{selected.employment_type}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-warm-brown"><Icon name="Banknote" size={14} />{selected.salary}</span>
              </div>
              {selected.description && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Описание</p><p className="text-sm leading-relaxed">{selected.description}</p></div>}
              {selected.requirements && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Требования</p><p className="text-sm leading-relaxed">{selected.requirements}</p></div>}
              <Button onClick={() => { setSelected(null); setRespondVacancy(selected); setFormError(""); setFormSuccess(""); setRespondModal(true); }} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                Откликнуться
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
                  <SelectContent>{CITIES.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={vacForm.specialty} onValueChange={v => setVacForm({ ...vacForm, specialty: v })}>
                  <SelectTrigger><SelectValue placeholder="Специальность *" /></SelectTrigger>
                  <SelectContent>{SPECS.slice(1).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Select value={vacForm.employment_type} onValueChange={v => setVacForm({ ...vacForm, employment_type: v })}>
                <SelectTrigger><SelectValue placeholder="Тип занятости *" /></SelectTrigger>
                <SelectContent>{["Полная занятость","Частичная занятость","Удалённо","Гибкий график"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Зарплата от (₽)" value={vacForm.salary_from} onChange={e => setVacForm({ ...vacForm, salary_from: e.target.value })} />
                <Input type="number" placeholder="Зарплата до (₽)" value={vacForm.salary_to} onChange={e => setVacForm({ ...vacForm, salary_to: e.target.value })} />
              </div>
              <textarea rows={3} placeholder="Описание" value={vacForm.description} onChange={e => setVacForm({ ...vacForm, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <textarea rows={2} placeholder="Требования" value={vacForm.requirements} onChange={e => setVacForm({ ...vacForm, requirements: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <Input placeholder="Email для откликов *" value={vacForm.contact_email} onChange={e => setVacForm({ ...vacForm, contact_email: e.target.value })} />
              <Input placeholder="Телефон" value={vacForm.contact_phone} onChange={e => setVacForm({ ...vacForm, contact_phone: e.target.value })} />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleCreate} disabled={formLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {formLoading ? "Размещаем..." : "Разместить"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
