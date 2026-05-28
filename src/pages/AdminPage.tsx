import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

type Section = "stats" | "vacancies" | "resumes" | "messages" | "responses" | "blog";

interface Stats { vac_active: number; vac_total: number; res_active: number; msgs_new: number; responses: number; posts: number; }

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "stats", label: "Обзор", icon: "LayoutDashboard" },
  { id: "vacancies", label: "Вакансии", icon: "Briefcase" },
  { id: "resumes", label: "Резюме", icon: "FileText" },
  { id: "messages", label: "Сообщения", icon: "MessageCircle" },
  { id: "responses", label: "Отклики", icon: "Send" },
  { id: "blog", label: "Блог", icon: "BookOpen" },
];

export default function AdminPage() {
  const [password, setPassword] = useState(() => sessionStorage.getItem("admin_pw") || "");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [section, setSection] = useState<Section>("stats");
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Blog modal
  const [blogModal, setBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState({ title: "", slug: "", excerpt: "", content: "", tag: "", author: "Редакция", is_published: true });
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogSuccess, setBlogSuccess] = useState("");
  const [editPost, setEditPost] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async (sec: Section) => {
    if (!authed) return;
    setLoading(true);
    try {
      if (sec === "stats") {
        const d = await api.admin.request<Stats>("stats", "GET", undefined, password);
        setStats(d);
      } else {
        const d = await api.admin.request<{ items: unknown[] }>(sec, "GET", undefined, password);
        setData(prev => ({ ...prev, [sec]: d.items }));
      }
    } finally { setLoading(false); }
  }, [authed, password]);

  useEffect(() => { if (authed) load(section); }, [authed, section, load]);

  const login = async () => {
    setAuthLoading(true); setAuthError("");
    try {
      await api.admin.request<Stats>("stats", "GET", undefined, password);
      sessionStorage.setItem("admin_pw", password);
      setAuthed(true);
    } catch {
      setAuthError("Неверный пароль");
    } finally { setAuthLoading(false); }
  };

  const toggle = async (sec: "vacancies" | "resumes", id: number, isActive: boolean) => {
    await api.admin.request(`${sec}`, "PUT", { id, is_active: !isActive }, password);
    load(sec);
  };

  const deactivate = async (sec: "vacancies" | "resumes", id: number) => {
    await api.admin.request(`${sec}`, "DELETE", { id }, password);
    load(sec);
  };

  const createPost = async () => {
    setBlogLoading(true); setBlogSuccess("");
    try {
      if (editPost) {
        await api.admin.request("blog", "PUT", { id: editPost.id, ...blogForm }, password);
      } else {
        await api.admin.request("blog", "POST", blogForm, password);
      }
      setBlogSuccess("Сохранено!");
      load("blog");
      setTimeout(() => { setBlogModal(false); setBlogSuccess(""); setEditPost(null); setBlogForm({ title: "", slug: "", excerpt: "", content: "", tag: "", author: "Редакция", is_published: true }); }, 1500);
    } finally { setBlogLoading(false); }
  };

  const deletePost = async (id: number) => {
    await api.admin.request("blog", "DELETE", { id }, password);
    load("blog");
  };

  const formatDate = (s: string) => {
    try { return new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return s; }
  };

  // Auth screen
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="text-4xl">✝</span>
            <h1 className="font-display text-3xl font-light text-warm-brown mt-3">Благодать</h1>
            <p className="text-sm text-muted-foreground mt-1">Панель управления</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-4 text-center">Введите пароль администратора</p>
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
              className="mb-3"
            />
            {authError && <p className="text-sm text-red-500 mb-3 text-center">{authError}</p>}
            <Button onClick={login} disabled={authLoading || !password} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
              {authLoading ? "Проверяем..." : "Войти"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const items = data[section] || [];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-card border-r border-border flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border flex items-center gap-2">
          <span className="text-xl">✝</span>
          <span className="font-display text-lg font-semibold text-warm-brown">Благодать</span>
        </div>
        <nav className="flex-1 p-2">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setSection(s.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${section === s.id ? "bg-warm-brown text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon name={s.icon as "Home"} size={16} />
              {s.label}
              {s.id === "messages" && stats?.msgs_new ? (
                <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0">{stats.msgs_new}</Badge>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => { setAuthed(false); sessionStorage.removeItem("admin_pw"); }} className="w-full text-muted-foreground hover:text-foreground">
            <Icon name="LogOut" size={14} className="mr-2" /> Выйти
          </Button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 sticky top-0 z-20">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Icon name="Menu" size={20} className="text-muted-foreground" />
          </button>
          <h2 className="font-semibold text-foreground">{SECTIONS.find(s => s.id === section)?.label}</h2>
          {section === "blog" && (
            <Button size="sm" onClick={() => { setEditPost(null); setBlogForm({ title: "", slug: "", excerpt: "", content: "", tag: "", author: "Редакция", is_published: true }); setBlogModal(true); }} className="ml-auto bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
              <Icon name="Plus" size={14} className="mr-1" /> Новая статья
            </Button>
          )}
        </header>

        <div className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Icon name="Loader" size={32} className="opacity-30 animate-spin" />
            </div>
          ) : (
            <>
              {/* STATS */}
              {section === "stats" && stats && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: "Активных вакансий", value: stats.vac_active, icon: "Briefcase", color: "text-warm-brown" },
                      { label: "Всего вакансий", value: stats.vac_total, icon: "Archive", color: "text-muted-foreground" },
                      { label: "Активных резюме", value: stats.res_active, icon: "FileText", color: "text-sage" },
                      { label: "Новых сообщений", value: stats.msgs_new, icon: "MessageCircle", color: "text-red-500" },
                      { label: "Откликов", value: stats.responses, icon: "Send", color: "text-warm-brown" },
                      { label: "Статей блога", value: stats.posts, icon: "BookOpen", color: "text-sage" },
                    ].map(stat => (
                      <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name={stat.icon as "Home"} size={16} className={stat.color} />
                          <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className={`font-display text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-warm-brown/5 border border-warm-brown/20 rounded-xl p-5">
                    <p className="font-display text-lg text-warm-brown mb-1">Добро пожаловать в панель управления</p>
                    <p className="text-sm text-muted-foreground">Используйте меню слева для управления вакансиями, резюме, заявками и блогом.</p>
                  </div>
                </div>
              )}

              {/* VACANCIES */}
              {section === "vacancies" && (
                <div className="space-y-3">
                  {(items as Record<string, unknown>[]).map(v => (
                    <div key={String(v.id)} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{String(v.title)}</h3>
                          {v.tag && <Badge variant="outline" className="text-xs shrink-0">{String(v.tag)}</Badge>}
                          <Badge variant={v.is_active ? "default" : "secondary"} className={`text-xs shrink-0 ${v.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}>
                            {v.is_active ? "Активна" : "Скрыта"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{String(v.organization)} · {String(v.city)} · {String(v.specialty)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(String(v.created_at))}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => toggle("vacancies", Number(v.id), Boolean(v.is_active))} className="text-xs h-7">
                          {v.is_active ? "Скрыть" : "Показать"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deactivate("vacancies", Number(v.id))} className="text-xs h-7 text-red-500 hover:text-red-600 border-red-200">
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-center text-muted-foreground py-12">Вакансий нет</p>}
                </div>
              )}

              {/* RESUMES */}
              {section === "resumes" && (
                <div className="space-y-3">
                  {(items as Record<string, unknown>[]).map(r => (
                    <div key={String(r.id)} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage/30 to-gold/30 flex items-center justify-center shrink-0">
                        <span className="font-display font-semibold text-warm-brown text-sm">
                          {String(r.first_name || "")[0]}{String(r.last_name || "")[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{String(r.first_name)} {String(r.last_name)}</h3>
                          <Badge variant={r.is_active ? "default" : "secondary"} className={`text-xs ${r.is_active ? "bg-green-100 text-green-700 border-green-200" : ""}`}>
                            {r.is_active ? "Активно" : "Скрыто"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{String(r.title)} · {String(r.city)} · {String(r.specialty)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{String(r.contact_email)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => toggle("resumes", Number(r.id), Boolean(r.is_active))} className="text-xs h-7">
                          {r.is_active ? "Скрыть" : "Показать"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deactivate("resumes", Number(r.id))} className="text-xs h-7 text-red-500 border-red-200">
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-center text-muted-foreground py-12">Резюме нет</p>}
                </div>
              )}

              {/* MESSAGES */}
              {section === "messages" && (
                <div className="space-y-3">
                  {(items as Record<string, unknown>[]).map(m => (
                    <div key={String(m.id)} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{String(m.name)}</p>
                          <p className="text-sm text-warm-brown">{String(m.contact)}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatDate(String(m.created_at))}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{String(m.message)}</p>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-center text-muted-foreground py-12">Сообщений нет</p>}
                </div>
              )}

              {/* RESPONSES */}
              {section === "responses" && (
                <div className="space-y-3">
                  {(items as Record<string, unknown>[]).map(r => (
                    <div key={String(r.id)} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{String(r.name)}</p>
                          <p className="text-sm text-warm-brown">{String(r.contact)}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatDate(String(r.created_at))}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Вакансия: <span className="font-medium text-foreground">{String(r.vacancy_title || "—")} · {String(r.organization || "")}</span></p>
                      {r.message && <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-2 mt-2">{String(r.message)}</p>}
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-center text-muted-foreground py-12">Откликов нет</p>}
                </div>
              )}

              {/* BLOG */}
              {section === "blog" && (
                <div className="space-y-3">
                  {(items as Record<string, unknown>[]).map(p => (
                    <div key={String(p.id)} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{String(p.title)}</h3>
                          {p.tag && <Badge variant="outline" className="text-xs shrink-0 border-sage/40 text-sage">{String(p.tag)}</Badge>}
                          <Badge variant={p.is_published ? "default" : "secondary"} className={`text-xs shrink-0 ${p.is_published ? "bg-green-100 text-green-700 border-green-200" : ""}`}>
                            {p.is_published ? "Опубликована" : "Скрыта"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{String(p.excerpt || "")}</p>
                        <p className="text-xs text-muted-foreground mt-1">Автор: {String(p.author)} · {formatDate(String(p.created_at))}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditPost(p);
                          setBlogForm({ title: String(p.title), slug: String(p.slug || ""), excerpt: String(p.excerpt || ""), content: String(p.content || ""), tag: String(p.tag || ""), author: String(p.author || "Редакция"), is_published: Boolean(p.is_published) });
                          setBlogModal(true);
                        }} className="text-xs h-7">Редактировать</Button>
                        <Button size="sm" variant="outline" onClick={() => deletePost(Number(p.id))} className="text-xs h-7 text-red-500 border-red-200">Скрыть</Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-center text-muted-foreground py-12">Статей нет</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Blog post modal */}
      <Dialog open={blogModal} onOpenChange={v => { setBlogModal(v); if (!v) { setEditPost(null); setBlogSuccess(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-warm-brown">
              {editPost ? "Редактировать статью" : "Новая статья"}
            </DialogTitle>
          </DialogHeader>
          {blogSuccess ? (
            <div className="text-center py-6"><Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-sage" /><p className="font-medium">{blogSuccess}</p></div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Заголовок *" value={blogForm.title} onChange={e => setBlogForm({ ...blogForm, title: e.target.value })} />
              <Input placeholder="Slug (URL, например: moya-statya)" value={blogForm.slug} onChange={e => setBlogForm({ ...blogForm, slug: e.target.value })} />
              <textarea rows={2} placeholder="Краткое описание (анонс)" value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <textarea rows={10} placeholder="Текст статьи *&#10;&#10;Поддерживается разметка:&#10;## Заголовок раздела&#10;**Жирный текст**" value={blogForm.content} onChange={e => setBlogForm({ ...blogForm, content: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={blogForm.tag} onValueChange={v => setBlogForm({ ...blogForm, tag: v })}>
                  <SelectTrigger><SelectValue placeholder="Тег" /></SelectTrigger>
                  <SelectContent>
                    {["Призвание", "Советы", "Истории", "Новости"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Автор" value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={blogForm.is_published} onChange={e => setBlogForm({ ...blogForm, is_published: e.target.checked })} className="rounded" />
                <span className="text-sm">Опубликовать</span>
              </label>
              <Button onClick={createPost} disabled={blogLoading} className="w-full bg-warm-brown text-primary-foreground hover:bg-warm-brown/90">
                {blogLoading ? "Сохраняем..." : editPost ? "Сохранить изменения" : "Опубликовать статью"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
