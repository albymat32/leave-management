import type { EmployeeLite } from "./types";

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    credentials: "include"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const Api = {
  bootstrap: () => api<{ has_admin: boolean }>("/api/bootstrap"),

  me: () => api<{ id: string; role: string; name: string }>("/api/auth/me"),
  login: (body: { name: string; dob: string }) =>
    api("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => api("/api/auth/logout", { method: "POST" }),

  registerAdmin: (body: { setupCode: string; name: string; dob: string; email: string }) =>
    api("/api/auth/register-admin", { method: "POST", body: JSON.stringify(body) }),

  registerEmployee: (body: { name: string; dob: string; employeeCode: string; email?: string }) =>
    api("/api/auth/register-employee", { method: "POST", body: JSON.stringify(body) }),

  applyLeave: (body: { startDate: string; endDate: string; excludedDates: string[]; reason: string }) =>
    api("/api/leaves", { method: "POST", body: JSON.stringify(body) }),

  myLeaves: (month?: string) => api(`/api/leaves/my${month ? `?month=${encodeURIComponent(month)}` : ""}`),

  adminEmployees: (): Promise<EmployeeLite[]> =>
    api<EmployeeLite[]>("/api/admin/employees"),

  adminPending: (params: { employeeId?: string; month?: string }) => {
    const q = new URLSearchParams();
    if (params.employeeId) q.set("employeeId", params.employeeId);
    if (params.month) q.set("month", params.month);
    return api(`/api/admin/leaves/pending?${q.toString()}`);
  },
  adminEmployeeLeaves: (employeeId: string, month?: string) =>
    api(`/api/admin/employees/${employeeId}/leaves${month ? `?month=${encodeURIComponent(month)}` : ""}`),

  decideLeave: (leaveId: string, body: { decision: "approved" | "rejected"; comment?: string }) =>
    api(`/api/admin/leaves/${leaveId}/decision`, { method: "POST", body: JSON.stringify(body) }),

  getEmailConfig: () => api("/api/admin/email-config"),
  putEmailConfig: (body: any) => api("/api/admin/email-config", { method: "PUT", body: JSON.stringify(body) }),
  testEmail: () => api("/api/admin/email-config/test", { method: "POST" })
};