const URLS = {
  vacancies: "https://functions.poehali.dev/66f84417-5661-49b4-980c-54a231ac6829",
  resumes: "https://functions.poehali.dev/81651cdd-ce92-461e-b08a-1d350afa08ee",
  contacts: "https://functions.poehali.dev/729b3366-069b-4d08-9569-600a2cffe1ea",
  blog: "https://functions.poehali.dev/62965943-5cae-4690-9ef4-31b6ed2e6113",
  admin: "https://functions.poehali.dev/e7415f2f-33e6-4384-8af3-a7e71ccb6cb3",
  auth: "https://functions.poehali.dev/729b3366-069b-4d08-9569-600a2cffe1ea",
};

// Auth token helpers
export const authStorage = {
  getToken: () => localStorage.getItem("auth_token") || "",
  setToken: (t: string) => localStorage.setItem("auth_token", t),
  clear: () => { localStorage.removeItem("auth_token"); localStorage.removeItem("auth_role"); localStorage.removeItem("auth_name"); },
  setUser: (role: string, name: string) => { localStorage.setItem("auth_role", role); localStorage.setItem("auth_name", name); },
  getRole: () => localStorage.getItem("auth_role") || "",
  getName: () => localStorage.getItem("auth_name") || "",
  isAuthed: () => !!localStorage.getItem("auth_token"),
};

export interface User {
  id: number;
  email: string;
  role: "employer" | "seeker";
  first_name: string;
  last_name: string;
  organization?: string;
  city?: string;
  about?: string;
  phone?: string;
  created_at: string;
}

export interface Vacancy {
  id: number;
  title: string;
  organization: string;
  city: string;
  salary_from: number | null;
  salary_to: number | null;
  salary: string;
  specialty: string;
  employment_type: string;
  description: string;
  requirements: string;
  tag: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

export interface Resume {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  city: string;
  salary_from: number | null;
  salary: string;
  specialty: string;
  experience_years: number;
  exp: string;
  about: string;
  skills: string;
  created_at: string;
}

export interface VacancyFilters {
  specialty?: string;
  city?: string;
  salary_min?: string;
  salary_max?: string;
  search?: string;
}

export interface ResumeFilters {
  specialty?: string;
  city?: string;
  salary_min?: string;
  search?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

export const api = {
  vacancies: {
    list: (filters: VacancyFilters = {}): Promise<{ vacancies: Vacancy[]; total: number }> => {
      const params = new URLSearchParams();
      if (filters.specialty) params.set("specialty", filters.specialty);
      if (filters.city) params.set("city", filters.city);
      if (filters.salary_min) params.set("salary_min", filters.salary_min);
      if (filters.salary_max) params.set("salary_max", filters.salary_max);
      if (filters.search) params.set("search", filters.search);
      const qs = params.toString();
      return request(`${URLS.vacancies}${qs ? "?" + qs : ""}`);
    },

    create: (data: Partial<Vacancy>): Promise<{ success: boolean; id: number }> =>
      request(URLS.vacancies, { method: "POST", body: JSON.stringify(data) }),

    respond: (data: { vacancy_id: number; name: string; contact: string; message?: string }): Promise<{ success: boolean }> =>
      request(`${URLS.vacancies}/respond`, { method: "POST", body: JSON.stringify(data) }),
  },

  resumes: {
    list: (filters: ResumeFilters = {}): Promise<{ resumes: Resume[]; total: number }> => {
      const params = new URLSearchParams();
      if (filters.specialty) params.set("specialty", filters.specialty);
      if (filters.city) params.set("city", filters.city);
      if (filters.salary_min) params.set("salary_min", filters.salary_min);
      if (filters.search) params.set("search", filters.search);
      const qs = params.toString();
      return request(`${URLS.resumes}${qs ? "?" + qs : ""}`);
    },

    create: (data: object): Promise<{ success: boolean; id: number }> =>
      request(URLS.resumes, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Token": authStorage.getToken() },
        body: JSON.stringify(data),
      }),

    mine: (): Promise<{ resume: Resume | null }> =>
      request(`${URLS.resumes}?action=mine`, {
        headers: { "Content-Type": "application/json", "X-Session-Token": authStorage.getToken() },
      }),

    update: (data: Partial<Resume> & { id: number }): Promise<{ success: boolean }> =>
      request(URLS.resumes, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Session-Token": authStorage.getToken() },
        body: JSON.stringify(data),
      }),
  },

  contacts: {
    send: (data: { name: string; contact: string; message: string }): Promise<{ success: boolean }> =>
      request(URLS.contacts, { method: "POST", body: JSON.stringify(data) }),
  },

  blog: {
    list: (tag?: string): Promise<{ posts: BlogPost[]; total: number }> => {
      const qs = tag ? `?tag=${encodeURIComponent(tag)}` : "";
      return request(`${URLS.blog}${qs}`);
    },
    get: (slug: string): Promise<{ post: BlogPost }> =>
      request(`${URLS.blog}?slug=${encodeURIComponent(slug)}`),
  },

  admin: {
    request: <T>(section: string, method = "GET", body?: object, password = ""): Promise<T> =>
      request(`${URLS.admin}?section=${section}`, {
        method,
        headers: { "Content-Type": "application/json", "X-Admin-Password": password },
        body: body ? JSON.stringify(body) : undefined,
      }),
  },

  auth: {
    register: (data: object): Promise<{ success: boolean; token: string; role: string; first_name: string }> =>
      request(`${URLS.auth}?action=register`, { method: "POST", body: JSON.stringify(data) }),

    login: (email: string, password: string): Promise<{ success: boolean; token: string; role: string; first_name: string; last_name: string; id: number }> =>
      request(`${URLS.auth}?action=login`, { method: "POST", body: JSON.stringify({ email, password }) }),

    me: (): Promise<{ user: User }> =>
      request(`${URLS.auth}?action=me`, {
        headers: { "Content-Type": "application/json", "X-Session-Token": authStorage.getToken() },
      }),

    update: (data: Partial<User>): Promise<{ success: boolean }> =>
      request(`${URLS.auth}?action=update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Session-Token": authStorage.getToken() },
        body: JSON.stringify(data),
      }),

    logout: (): Promise<{ success: boolean }> =>
      request(`${URLS.auth}?action=logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Token": authStorage.getToken() },
      }),
  },
};

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tag: string;
  author: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}