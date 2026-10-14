create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null check (char_length(code) between 1 and 12),
  name text not null check (char_length(name) between 1 and 80),
  instructor text not null default '',
  grade numeric(5,2) not null default 0 check (grade between 0 and 100),
  final_grade numeric(4,2) check (final_grade between 1 and 5),
  grade_result text not null default '' check (grade_result in ('', 'P', 'F')),
  credits integer not null default 3 check (credits between 0 and 12),
  considered boolean not null default true,
  course_type text not null default 'Core' check (course_type in ('Specialization', 'Core', 'Elective')),
  prerequisite_ids jsonb not null default '[]'::jsonb,
  corequisite_ids jsonb not null default '[]'::jsonb,
  gradebook jsonb,
  color text not null default '#ff6b51',
  assessments integer not null default 0 check (assessments >= 0),
  created_at timestamptz not null default now()
);

alter table public.courses add column if not exists instructor text not null default '';
alter table public.courses add column if not exists final_grade numeric(4,2) check (final_grade between 1 and 5);
alter table public.courses add column if not exists grade_result text not null default '';
alter table public.courses add column if not exists considered boolean not null default true;
alter table public.courses add column if not exists course_type text not null default 'Core';
alter table public.courses add column if not exists prerequisite_ids jsonb not null default '[]'::jsonb;
alter table public.courses add column if not exists corequisite_ids jsonb not null default '[]'::jsonb;
alter table public.courses add column if not exists gradebook jsonb;

alter table public.courses enable row level security;

drop policy if exists "Users can read their courses" on public.courses;
create policy "Users can read their courses"
on public.courses for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their courses" on public.courses;
create policy "Users can create their courses"
on public.courses for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their courses" on public.courses;
create policy "Users can update their courses"
on public.courses for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their courses" on public.courses;
create policy "Users can delete their courses"
on public.courses for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.courses to authenticated;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  year text not null default '',
  student_number text not null default '',
  curriculum text not null default '',
  goal_gwa numeric(5,2),
  scale_type text not null default '1-highest' check (scale_type in ('1-highest', '5-highest')),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists curriculum text not null default '';

alter table public.profiles enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.profiles to authenticated;

create or replace function public.delete_own_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

create table if not exists public.terms (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  academic_year text not null,
  format text not null check (format in ('quarter', 'semester', 'trimester')),
  term_number integer not null check (term_number between 1 and 4),
  start_date date not null,
  end_date date not null,
  target_gwa numeric(4,2) not null,
  notes text not null default '',
  course_ids jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  archived boolean not null default false,
  grades_locked boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.terms enable row level security;
drop policy if exists "Users manage their terms" on public.terms;
create policy "Users manage their terms" on public.terms for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on table public.terms to authenticated;
