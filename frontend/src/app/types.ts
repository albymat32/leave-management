export type Role = "admin" | "employee";

export type Me = {
  id: string;
  role: Role;
  name: string;
};

export type Leave = {
  id: string;
  startDate: string;
  endDate: string;
  excludedDates: string[];
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminComment?: string | null;
  createdAt: string;
};

export type EmailConfig = {
  enabled: boolean;
  provider: string;
  mode: "smtp" | "api";
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  senderEmail?: string | null;
  senderName?: string | null;
  isValid: boolean;
};

export type EmployeeLite = {
  id: string;
  name: string;
};