import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, authStorage, User, Resume } from "@/lib/api";

type AuthMode = "login" | "register";
type Tab = "profile" | "resume";

const CITIES = ["Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Удалённо", "Другой город"];
const SPECS = ["Образование", "Финансы", "Социальная сфера", "IT", "Психология", "Творчество", "Администрация", "Медицина", "Юриспруденция"];

const emptyResume = { title: "", city: "", specialty: "", experience_years: "", salary_from: "", about: "", skills: "", contact_phone: "" };

export default function ProfilePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<Tab>("profile");
  const [editProfile, setEditProfile] = useState(false);

  // Auth forms
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ email: "", password: "", first_name: "", last_name: "", organization: "", city: "", phone: "" });

  // Profile edit
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", organization: "", city: "", about: "", phone: "" });

  // Resume
  const [myResume, setMyResume] = useState<Resume | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [editResume, setEditResume] = useState(false);
  const [resumeForm, setResumeForm] = useState(emptyResume);
  const [resumeError, setResumeError] = useState("");
  const [resumeSuccess, setResumeSuccess] = useState("");

  const loadMe = async () => {
    const d = await api.auth.me();
    setUser(d.user);
    setEditForm({
      first_name: d.user.first_name, last_name: d.user.last_name,
      organization: d.user.organization || "", city: d.user.city || "",
      about: d.user.about || "", phone: d.user.phone || "",
    });
  };

  const loadMyResume = async () => {
    setResumeLoading(true);
    try {
      const d = await api.resumes.mine();
      setMyResume(d.resume);
      if (d.resume) {
        setResumeForm({
          title: d.resume.title || "",
          city: d.resume.city || "",
          specialty: d.resume.specialty || "",
          experience_years: d.resume.experience_years ? String(d.resume.experience_years) : "",
          salary_from: d.resume.salary_from ? String(d.resume.salary_from) : "",
          about: d.resume.about || "",
          skills: d.resume.skills || "",
          contact_phone: "",
        });
      }
    } finally { setResumeLoading(false); }
  };

  useEffect(() => {
    if (authStorage.isAuthed()) {
      loadMe().catch(() => { authStorage.clear(); }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "seeker" && tab === "resume") loadMyResume();
  }, [tab, user]);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const res = await api.auth.login(loginForm.email, loginForm.password);
      authStorage.setToken(res.token); authStorage.setUser(res.role, res.first_name);
      await loadMe();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка входа"); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError(""); setLoading(true);
    try {
      const res = await api.auth.register({ ...regForm, role });
      authStorage.setToken(res.token); authStorage.setUser(res.role, res.first_name);
      await loadMe();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка регистрации"); }
    finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.auth.update(editForm);
      await loadMe();
      setEditProfile(false);
      setSuccess("Профиль обновлён!"); setTimeout(() => setSuccess(""), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
  };

  const handleSaveResume = async () => {
    setSaving(true); setResumeError(""); setResumeSuccess("");
    try {
      if (!resumeForm.title || !resumeForm.city || !resumeForm.specialty) {
        setResumeError("Заполните должность, город и специальность");
        setSaving(false); return;
      }
      const data = {
        ...resumeForm,
        first_name: user!.first_name,
        last_name: user!.last_name,
        contact_email: user!.email,
        experience_years: resumeForm.experience_years ? Number(resumeForm.experience_years) : 0,
        salary_from: resumeForm.salary_from ? Number(resumeForm.salary_from) : undefined,
      };

      if (myResume?.id) {
        // Обновить существующее
        await api.resumes.update({ id: myResume.id, ...data } as Resume & { id: number });
      } else {
        // Создать новое
        await api.resumes.create(data);
      }
      await loadMyResume();
      setEditResume(false);
      setResumeSuccess(myResume ? "Резюме обновлено!" : "Резюме опубликовано!");
      setTimeout(() => setResumeSuccess(""), 3000);
    } catch (e) { setResumeError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
  };

  const handleToggleResume = async () => {
    if (!myResume) return;
    await api.resumes.update({ id: myResume.id, is_active: !myResume.is_active } as Resume & { id: number });
    await loadMyResume();
  };

  const handleLogout = async () => {
    await api.auth.logout(); authStorage.clear(); setUser(null); navigate("/");
  };

  // ── Loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Icon name="Loader" size={32} className="opacity-30 animate-spin" />
        </div>
      </Layout>
    );
  }

  // ── Not authed ──────────────────────────────────────────────────
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            {mode === "register" && (
              <div className="flex gap-3 mb-6">
                {(["seeker", "employer"] as const).map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${role === r ? "bg-warm-brown text-primary-foreground border-warm-brown shadow-sm" : "bg-card border-border text-muted-foreground hover:border-warm-brown/40"}`}>
                    <Icon name={r === "seeker" ? "User" : "Building2"} size={16} className="mx-auto mb-1" />
                    {r === "seeker" ? "Соискатель" : "Работодатель"}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <span className="text-3xl">✝</span>
                <h1 className="font-display text-2xl text-warm-brown mt-2">
                  {mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === "login" ? "Введите данные для входа" : "Зарегистрируйтесь в сообществе"}
                </p>
              </div>

              {mode === "login" ? (
                <div className="space-y-3">
                  <Input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  <Input type="password" placeholder="Пароль" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button onClick={handleLogin} disabled={loading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">Войти</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Имя *" value={regForm.first_name} onChange={e => setRegForm({ ...regForm, first_name: e.target.value })} />
                    <Input placeholder="Фамилия *" value={regForm.last_name} onChange={e => setRegForm({ ...regForm, last_name: e.target.value })} />
                  </div>
                  {role === "employer" && <Input placeholder="Организация" value={regForm.organization} onChange={e => setRegForm({ ...regForm, organization: e.target.value })} />}
                  <Input type="email" placeholder="Email *" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                  <Input type="password" placeholder="Пароль (мин. 6 символов) *" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} />
                  <Select value={regForm.city} onValueChange={v => setRegForm({ ...regForm, city: v })}>
                    <SelectTrigger><SelectValue placeholder="Город" /></SelectTrigger>
                    <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button onClick={handleRegister} disabled={loading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">Зарегистрироваться</Button>
                  <p className="text-xs text-muted-foreground text-center">Регистрируясь, вы присоединяетесь к сообществу с христианскими ценностями</p>
                </div>
              )}

              <div className="mt-4 text-center">
                <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-sm text-warm-brown hover:underline">
                  {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Authed profile ──────────────────────────────────────────────
  const isEmployer = user.role === "employer";

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-br from-cream to-light-sage/20 border-b border-border py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sage/30 to-gold/20 flex items-center justify-center border border-border text-3xl font-display font-semibold text-warm-brown shadow-sm flex-shrink-0">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-display text-3xl font-semibold text-warm-brown">{user.first_name} {user.last_name}</h1>
                <Badge className={`text-xs font-medium ${isEmployer ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-sage/10 text-sage border-sage/30"}`} variant="outline">
                  {isEmployer ? "Работодатель" : "Соискатель"}
                </Badge>
              </div>
              {user.organization && <p className="text-muted-foreground text-sm">{user.organization}</p>}
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {user.city && <span className="flex items-center gap-1"><Icon name="MapPin" size={13} />{user.city}</span>}
                <span className="flex items-center gap-1"><Icon name="Mail" size={13} />{user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={13} />{user.phone}</span>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 flex-shrink-0">
              <Icon name="LogOut" size={14} className="mr-1" /> Выйти
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-8 border-b border-border -mb-px">
            {([
              { id: "profile", label: "Профиль", icon: "User" },
              ...(isEmployer ? [] : [{ id: "resume", label: "Моё резюме", icon: "FileText" }]),
            ] as { id: Tab; label: string; icon: string }[]).map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSuccess(""); setError(""); setEditProfile(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-warm-brown text-warm-brown" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <Icon name={t.icon as "User"} size={14} /> {t.label}
                {t.id === "resume" && myResume && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${myResume.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {myResume.is_active ? "Активно" : "Скрыто"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Global success */}
        {success && (
          <div className="flex items-center gap-2 bg-sage/10 text-sage border border-sage/30 rounded-xl px-4 py-3 mb-6 text-sm animate-fade-in">
            <Icon name="CheckCircle" size={16} />{success}
          </div>
        )}

        {/* ── TAB: Profile ─────────────────────────────────────── */}
        {tab === "profile" && (
          editProfile ? (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl text-warm-brown mb-5">Редактировать профиль</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Имя</label>
                  <Input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Фамилия</label>
                  <Input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
                </div>
                {isEmployer && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Организация</label>
                    <Input value={editForm.organization} onChange={e => setEditForm({ ...editForm, organization: e.target.value })} />
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Город</label>
                  <Select value={editForm.city} onValueChange={v => setEditForm({ ...editForm, city: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите город" /></SelectTrigger>
                    <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Телефон</label>
                  <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+7 (___) ___-__-__" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">О себе</label>
                  <textarea rows={4} value={editForm.about} onChange={e => setEditForm({ ...editForm, about: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <div className="flex gap-3 mt-5">
                <Button onClick={handleSaveProfile} disabled={saving} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                  {saving ? "Сохраняем..." : "Сохранить"}
                </Button>
                <Button variant="outline" onClick={() => { setEditProfile(false); setError(""); }}>Отмена</Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2"><Icon name="User" size={16} className="text-warm-brown" />О себе</h2>
                  <button onClick={() => { setEditProfile(true); setError(""); }} className="text-xs text-warm-brown hover:underline">Изменить</button>
                </div>
                {user.about
                  ? <p className="text-sm text-muted-foreground leading-relaxed">{user.about}</p>
                  : <button onClick={() => setEditProfile(true)} className="text-sm text-muted-foreground/60 hover:text-warm-brown flex items-center gap-1.5"><Icon name="Plus" size={14} />Добавить описание</button>
                }
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold flex items-center gap-2 mb-4"><Icon name="Zap" size={16} className="text-warm-brown" />Быстрые действия</h2>
                <div className="space-y-1">
                  {isEmployer ? (<>
                    <button onClick={() => navigate("/vacancies")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left">
                      <Icon name="Briefcase" size={15} className="text-warm-brown" />Разместить вакансию
                    </button>
                    <button onClick={() => navigate("/resumes")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left">
                      <Icon name="FileText" size={15} className="text-sage" />Найти сотрудника
                    </button>
                  </>) : (<>
                    <button onClick={() => navigate("/vacancies")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left">
                      <Icon name="Search" size={15} className="text-warm-brown" />Найти вакансию
                    </button>
                    <button onClick={() => setTab("resume")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left">
                      <Icon name="FileText" size={15} className="text-sage" />Моё резюме
                    </button>
                  </>)}
                  <button onClick={() => navigate("/blog")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left">
                    <Icon name="BookOpen" size={15} className="text-muted-foreground" />Читать блог
                  </button>
                </div>
              </div>

              <div className="bg-warm-brown/5 border border-warm-brown/15 rounded-2xl p-5 md:col-span-2 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-warm-brown/10 flex items-center justify-center flex-shrink-0"><span className="text-lg">✝</span></div>
                <div>
                  <p className="font-medium text-warm-brown text-sm">Член сообщества «Благодать»</p>
                  <p className="text-xs text-muted-foreground mt-0.5">С нами с {new Date(user.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          )
        )}

        {/* ── TAB: Resume (только для соискателя) ──────────────── */}
        {tab === "resume" && !isEmployer && (
          <div>
            {resumeSuccess && (
              <div className="flex items-center gap-2 bg-sage/10 text-sage border border-sage/30 rounded-xl px-4 py-3 mb-6 text-sm animate-fade-in">
                <Icon name="CheckCircle" size={16} />{resumeSuccess}
              </div>
            )}

            {resumeLoading ? (
              <div className="flex items-center justify-center py-20"><Icon name="Loader" size={28} className="opacity-30 animate-spin" /></div>
            ) : editResume ? (
              /* ── Форма редактирования резюме ── */
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-display text-xl text-warm-brown mb-5">
                  {myResume ? "Редактировать резюме" : "Создать резюме"}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Желаемая должность *</label>
                    <Input placeholder="Например: Учитель начальных классов" value={resumeForm.title} onChange={e => setResumeForm({ ...resumeForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Специальность *</label>
                    <Select value={resumeForm.specialty} onValueChange={v => setResumeForm({ ...resumeForm, specialty: v })}>
                      <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                      <SelectContent>{SPECS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Город *</label>
                    <Select value={resumeForm.city} onValueChange={v => setResumeForm({ ...resumeForm, city: v })}>
                      <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                      <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Опыт работы (лет)</label>
                    <Input type="number" min="0" placeholder="0" value={resumeForm.experience_years} onChange={e => setResumeForm({ ...resumeForm, experience_years: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Желаемая зарплата (₽)</label>
                    <Input type="number" placeholder="Например: 60000" value={resumeForm.salary_from} onChange={e => setResumeForm({ ...resumeForm, salary_from: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1.5 block">О себе</label>
                    <textarea rows={4} placeholder="Расскажите о своём опыте, ценностях и мотивации..." value={resumeForm.about} onChange={e => setResumeForm({ ...resumeForm, about: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Навыки</label>
                    <textarea rows={2} placeholder="Например: 1С, педагогика, работа с детьми..." value={resumeForm.skills} onChange={e => setResumeForm({ ...resumeForm, skills: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                </div>
                {resumeError && <p className="text-sm text-red-500 mt-3">{resumeError}</p>}
                <div className="flex gap-3 mt-5">
                  <Button onClick={handleSaveResume} disabled={saving} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                    <Icon name="Send" size={14} className="mr-1.5" />
                    {saving ? "Публикуем..." : myResume ? "Сохранить изменения" : "Опубликовать резюме"}
                  </Button>
                  <Button variant="outline" onClick={() => { setEditResume(false); setResumeError(""); }}>Отмена</Button>
                </div>
              </div>
            ) : myResume ? (
              /* ── Просмотр резюме ── */
              <div className="space-y-5">
                {/* Preview card */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-cream to-light-sage/20 px-6 py-5 flex items-start justify-between gap-4 flex-wrap border-b border-border">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h2 className="font-display text-2xl font-semibold text-warm-brown">{myResume.title}</h2>
                        <Badge variant="outline" className={`text-xs ${myResume.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}>
                          {myResume.is_active ? "Опубликовано" : "Скрыто"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{myResume.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditResume(true); setResumeError(""); }} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground h-8">
                        <Icon name="Pencil" size={13} className="mr-1" />Редактировать
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleToggleResume} className={`h-8 text-xs ${myResume.is_active ? "border-muted-foreground/30 text-muted-foreground hover:text-red-500 hover:border-red-200" : "border-sage/40 text-sage hover:bg-sage/10"}`}>
                        {myResume.is_active ? <><Icon name="EyeOff" size={13} className="mr-1" />Скрыть</> : <><Icon name="Eye" size={13} className="mr-1" />Показать</>}
                      </Button>
                    </div>
                  </div>

                  <div className="px-6 py-5 space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Icon name="Tag" size={13} />{myResume.specialty}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Icon name="MapPin" size={13} />{myResume.city}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Icon name="Clock" size={13} />{myResume.exp}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-warm-brown bg-warm-brown/8 px-3 py-1.5 rounded-full">
                        <Icon name="Banknote" size={13} />{myResume.salary}
                      </span>
                    </div>

                    {myResume.about && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">О себе</p>
                        <p className="text-sm leading-relaxed">{myResume.about}</p>
                      </div>
                    )}
                    {myResume.skills && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Навыки</p>
                        <p className="text-sm leading-relaxed">{myResume.skills}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <Icon name="Info" size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">Резюме видно всем работодателям в разделе «База резюме». Вы можете в любой момент скрыть или отредактировать его.</p>
                </div>

                <Button variant="outline" onClick={() => navigate("/resumes")} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground">
                  <Icon name="ExternalLink" size={14} className="mr-1.5" />Посмотреть в базе резюме
                </Button>
              </div>
            ) : (
              /* ── Нет резюме ── */
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-cream border border-border flex items-center justify-center mx-auto mb-5">
                  <Icon name="FileText" size={32} className="text-warm-brown/30" />
                </div>
                <h2 className="font-display text-2xl text-warm-brown mb-2">Резюме ещё нет</h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Опубликуйте своё резюме — и работодатели из христианских организаций смогут найти вас сами.
                </p>
                <Button onClick={() => { setEditResume(true); setResumeError(""); setResumeForm(emptyResume); }} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90 px-6">
                  <Icon name="Plus" size={15} className="mr-1.5" />Создать резюме
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
