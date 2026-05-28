const URLS = {
  vacancies: "https://functions.poehali.dev/66f84417-5661-49b4-980c-54a231ac6829",
  resumes: "https://functions.poehali.dev/81651cdd-ce92-461e-b08a-1d350afa08ee",
  contacts: "https://functions.poehali.dev/729b3366-069b-4d08-9569-600a2cffe1ea",
};

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
      request(URLS.resumes, { method: "POST", body: JSON.stringify(data) }),
  },

  contacts: {
    send: (data: { name: string; contact: string; message: string }): Promise<{ success: boolean }> =>
      request(URLS.contacts, { method: "POST", body: JSON.stringify(data) }),
  },
};
