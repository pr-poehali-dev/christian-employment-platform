import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, Resume } from "@/lib/api";

const SPECS = ["Все специальности", "Образование", "Финансы", "Социальная сфера", "IT", "Психология", "Творчество"];
const CITIES = ["Все города", "Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Удалённо"];
const SALARY_RANGES = [
  { label: "Любая зарплата", min: "" },
  { label: "от 30 000 ₽", min: "30000" },
  { label: "от 50 000 ₽", min: "50000" },
  { label: "от 80 000 ₽", min: "80000" },
  { label: "от 120 000 ₽", min: "120000" },
];

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState("Все специальности");
  const [city, setCity] = useState("Все города");
  const [salaryLabel, setSalaryLabel] = useState("Любая зарплата");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Resume | null>(null);
  const [resModal, setResModal] = useState(false);
  const [resForm, setResForm] = useState({ first_name: "", last_name: "", title: "", city: "", specialty: "", experience_years: "", salary_from: "", about: "", contact_email: "", contact_phone: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = SALARY_RANGES.find(r => r.label === salaryLabel) || SALARY_RANGES[0];
      const data = await api.resumes.list({
        specialty: spec === "Все специальности" ? "" : spec,
        city: city === "Все города" ? "" : city,
        salary_min: range.min,
        search,
      });
      setResumes(data.resumes);
    } finally { setLoading(false); }
  }, [spec, city, salaryLabel, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setFormLoading(true); setFormError(""); setFormSuccess("");
    try {
      await api.resumes.create({ ...resForm, salary_from: resForm.salary_from ? Number(resForm.salary_from) : undefined, experience_years: resForm.experience_years ? Number(resForm.experience_years) : 0 });
      setFormSuccess("Резюме размещено!");
      load();
      setTimeout(() => { setResModal(false); setFormSuccess(""); }, 2000);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setFormLoading(false); }
  };

  return (
    <Layout onOpenResume={() => { setFormError(""); setFormSuccess(""); setResModal(true); }}>
      <div className="bg-gradient-to-br from-light-sage/30 to-cream py-16 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4">
          <p className="text-sm text-sage mb-2 tracking-widest uppercase">Поиск сотрудников</p>
          <h1 className="font-display text-5xl font-light text-warm-brown mb-3">База резюме</h1>
          <p className="text-muted-foreground max-w-xl">Соискатели с христианскими ценностями из разных городов и специальностей.</p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-10">
        <div className="bg-background rounded-2xl p-5 mb-8 border border-border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={spec} onValueChange={setSpec}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SPECS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={salaryLabel} onValueChange={setSalaryLabel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SALARY_RANGES.map(r => <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">Найдено: <span className="font-semibold text-foreground">{resumes.length}</span> резюме</p>
          <Button onClick={() => { setFormError(""); setFormSuccess(""); setResModal(true); }} size="sm" className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
            <Icon name="Plus" size={14} className="mr-1" /> Разместить резюме
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20"><Icon name="Loader" size={32} className="mx-auto mb-3 opacity-30 animate-spin" /></div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-display text-2xl mb-1">Ничего не найдено</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resumes.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
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
                <span className="font-semibold text-warm-brown text-sm">{r.salary}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl text-warm-brown">{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="font-display text-lg">{selected.title}</p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="MapPin" size={14} />{selected.city}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="Briefcase" size={14} />{selected.specialty}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-warm-brown"><Icon name="Banknote" size={14} />{selected.salary}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon name="Clock" size={14} />{selected.exp}</span>
              </div>
              {selected.about && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">О себе</p><p className="text-sm leading-relaxed">{selected.about}</p></div>}
              {selected.skills && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Навыки</p><p className="text-sm leading-relaxed">{selected.skills}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create resume */}
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
                  <SelectContent>{CITIES.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={resForm.specialty} onValueChange={v => setResForm({ ...resForm, specialty: v })}>
                  <SelectTrigger><SelectValue placeholder="Специальность *" /></SelectTrigger>
                  <SelectContent>{SPECS.slice(1).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Опыт (лет)" value={resForm.experience_years} onChange={e => setResForm({ ...resForm, experience_years: e.target.value })} />
                <Input type="number" placeholder="Зарплата от (₽)" value={resForm.salary_from} onChange={e => setResForm({ ...resForm, salary_from: e.target.value })} />
              </div>
              <textarea rows={4} placeholder="О себе" value={resForm.about} onChange={e => setResForm({ ...resForm, about: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <Input placeholder="Email *" value={resForm.contact_email} onChange={e => setResForm({ ...resForm, contact_email: e.target.value })} />
              <Input placeholder="Телефон" value={resForm.contact_phone} onChange={e => setResForm({ ...resForm, contact_phone: e.target.value })} />
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
