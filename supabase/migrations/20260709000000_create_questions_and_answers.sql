create table public.questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text,
  big_five_dimension text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create policy "read approved questions"
  on public.questions for select
  using (approved = true);

create table public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  answer text not null,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.user_answers enable row level security;

create policy "users own answers"
  on public.user_answers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
