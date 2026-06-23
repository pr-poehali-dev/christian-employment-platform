import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, authStorage, User } from "@/lib/api";

type AuthMode = "login" | "register";

const CITIES = ["Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Другой город"];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ email: "", password: "", first_name: "", last_name: "", organization: "", city: "", phone: "" });
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", organization: "", city: "", about: "", phone: "" });

  useEffect(() => {
    if (authStorage.isAuthed()) {
      api.auth.me()
        .then(d => {
          setUser(d.user);
          setEditForm({ first_name: d.user.first_name, last_name: d.user.last_name, organization: d.user.organization || "", city: d.user.city || "", about: d.user.about || "", phone: d.user.phone || "" });
        })
        .catch(() => { authStorage.clear(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const res = await api.auth.login(loginForm.email, loginForm.password);
      authStorage.setToken(res.token);
      authStorage.setUser(res.role, res.first_name);
      const me = await api.auth.me();
      setUser(me.user);
      setEditForm({ first_name: me.user.first_name, last_name: me.user.last_name, organization: me.user.organization || "", city: me.user.city || "", about: me.user.about || "", phone: me.user.phone || "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка входа"); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError(""); setLoading(true);
    try {
      const res = await api.auth.register({ ...regForm, role });
      authStorage.setToken(res.token);
      authStorage.setUser(res.role, res.first_name);
      const me = await api.auth.me();
      setUser(me.user);
      setEditForm({ first_name: me.user.first_name, last_name: me.user.last_name, organization: me.user.organization || "", city: me.user.city || "", about: me.user.about || "", phone: me.user.phone || "" });
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка регистрации"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.auth.update(editForm);
      const me = await api.auth.me();
      setUser(me.user);
      setEditMode(false);
      setSuccess("Профиль обновлён!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка сохранения"); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    authStorage.clear();
    setUser(null);
    navigate("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Icon name="Loader" size={32} className="opacity-30 animate-spin" />
        </div>
      </Layout>
    );
  }

  // ── Authorized: show profile ────────────────────────────────────
  if (user) {
    const isEmployer = user.role === "employer";
    return (
      <Layout>
        <div className="bg-gradient-to-br from-cream to-light-sage/20 border-b border-border py-12">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sage/30 to-gold/20 flex items-center justify-center border border-border text-3xl font-display font-semibold text-warm-brown shadow-sm">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-3xl font-semibold text-warm-brown">{user.first_name} {user.last_name}</h1>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${isEmployer ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-sage/10 text-sage border-sage/30"}`}>
                    {isEmployer ? "Работодатель" : "Соискатель"}
                  </span>
                </div>
                {user.organization && <p className="text-muted-foreground mt-0.5">{user.organization}</p>}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  {user.city && <span className="flex items-center gap-1"><Icon name="MapPin" size={13} />{user.city}</span>}
                  <span className="flex items-center gap-1"><Icon name="Mail" size={13} />{user.email}</span>
                  {user.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={13} />{user.phone}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditMode(true); setError(""); setSuccess(""); }} className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-primary-foreground">
                  <Icon name="Pencil" size={14} className="mr-1" /> Редактировать
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-500">
                  <Icon name="LogOut" size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-10">
          {success && (
            <div className="flex items-center gap-2 bg-sage/10 text-sage border border-sage/30 rounded-xl px-4 py-3 mb-6 text-sm">
              <Icon name="CheckCircle" size={16} />{success}
            </div>
          )}

          {editMode ? (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-2xl text-warm-brown mb-5">Редактировать профиль</h2>
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
                  <textarea rows={4} value={editForm.about} onChange={e => setEditForm({ ...editForm, about: e.target.value })} placeholder="Расскажите о себе..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <div className="flex gap-3 mt-5">
                <Button onClick={handleSave} disabled={saving} className="bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                  {saving ? "Сохраняем..." : "Сохранить"}
                </Button>
                <Button variant="outline" onClick={() => { setEditMode(false); setError(""); }}>Отмена</Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* About */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="User" size={16} className="text-warm-brown" /> О себе
                </h2>
                {user.about ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">{user.about}</p>
                ) : (
                  <button onClick={() => setEditMode(true)} className="text-sm text-warm-brown/60 hover:text-warm-brown flex items-center gap-1.5">
                    <Icon name="Plus" size={14} /> Добавить описание
                  </button>
                )}
              </div>

              {/* Quick links */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="Zap" size={16} className="text-warm-brown" /> Быстрые действия
                </h2>
                <div className="space-y-2">
                  {isEmployer ? (
                    <>
                      <button onClick={() => navigate("/vacancies")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left transition-colors">
                        <Icon name="Briefcase" size={16} className="text-warm-brown" /> Разместить вакансию
                      </button>
                      <button onClick={() => navigate("/resumes")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left transition-colors">
                        <Icon name="FileText" size={16} className="text-sage" /> Просмотреть резюме
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => navigate("/vacancies")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left transition-colors">
                        <Icon name="Search" size={16} className="text-warm-brown" /> Найти вакансию
                      </button>
                      <button onClick={() => navigate("/resumes")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left transition-colors">
                        <Icon name="FileText" size={16} className="text-sage" /> Разместить резюме
                      </button>
                    </>
                  )}
                  <button onClick={() => navigate("/blog")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm text-left transition-colors">
                    <Icon name="BookOpen" size={16} className="text-muted-foreground" /> Читать блог
                  </button>
                </div>
              </div>

              {/* Member since */}
              <div className="bg-warm-brown/5 border border-warm-brown/10 rounded-2xl p-6 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warm-brown/10 flex items-center justify-center">
                    <span className="text-lg">✝</span>
                  </div>
                  <div>
                    <p className="font-semibold text-warm-brown text-sm">Член сообщества «Благодать»</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      С нами с {new Date(user.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ── Not authorized: login / register ───────────────────────────
  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Role selector for register */}
          {mode === "register" && (
            <div className="flex gap-3 mb-6">
              {(["seeker", "employer"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${role === r ? "bg-warm-brown text-primary-foreground border-warm-brown shadow-sm" : "bg-card border-border text-muted-foreground hover:border-warm-brown/40"}`}
                >
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
                {mode === "login" ? "Введите свои данные для входа" : "Зарегистрируйтесь в сообществе"}
              </p>
            </div>

            {mode === "login" ? (
              <div className="space-y-3">
                <Input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                <Input type="password" placeholder="Пароль" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={handleLogin} disabled={loading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                  {loading ? "Входим..." : "Войти"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Имя *" value={regForm.first_name} onChange={e => setRegForm({ ...regForm, first_name: e.target.value })} />
                  <Input placeholder="Фамилия *" value={regForm.last_name} onChange={e => setRegForm({ ...regForm, last_name: e.target.value })} />
                </div>
                {role === "employer" && (
                  <Input placeholder="Организация" value={regForm.organization} onChange={e => setRegForm({ ...regForm, organization: e.target.value })} />
                )}
                <Input type="email" placeholder="Email *" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                <Input type="password" placeholder="Пароль (мин. 6 символов) *" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} />
                <Select value={regForm.city} onValueChange={v => setRegForm({ ...regForm, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Город" /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={handleRegister} disabled={loading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                  {loading ? "Регистрируем..." : "Зарегистрироваться"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Регистрируясь, вы присоединяетесь к сообществу с христианскими ценностями</p>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="text-sm text-warm-brown hover:underline"
              >
                {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
