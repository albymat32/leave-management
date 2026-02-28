-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin','employee')),
  name text not null,
  dob date not null,
  email text null,
  employee_code text null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_employee_code_unique
on public.users(employee_code)
where employee_code is not null;

create index if not exists users_name_dob_idx on public.users(name, dob);
create index if not exists users_role_idx on public.users(role);

-- Sessions (server-side)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ip text null,
  user_agent text null
);

create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

-- Leave requests
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_user_id uuid not null references public.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  excluded_dates jsonb not null default '[]'::jsonb,
  total_days int not null,
  reason text not null,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  admin_comment text null,
  decided_by_admin_user_id uuid null references public.users(id) on delete set null,
  decided_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists leave_status_idx on public.leave_requests(status);
create index if not exists leave_employee_created_idx on public.leave_requests(employee_user_id, created_at);

-- Email config (single row: id=1)
create table if not exists public.email_config (
  id int primary key,
  enabled boolean not null default false,
  provider text not null default 'custom_smtp',
  mode text not null default 'smtp' check (mode in ('smtp','api')),
  smtp_host text null,
  smtp_port int null,
  smtp_user text null,
  smtp_pass_enc text null,
  api_key_enc text null,
  sender_email text null,
  sender_name text null,
  updated_at timestamptz not null default now()
);

insert into public.email_config (id)
values (1)
on conflict (id) do nothing;

-- App settings (for one-time admin setup lock)
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);