create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  -- Big Five scores, 0-100. NULL means not enough data yet.
  openness          numeric check (openness between 0 and 100),
  conscientiousness numeric check (conscientiousness between 0 and 100),
  extraversion      numeric check (extraversion between 0 and 100),
  agreeableness     numeric check (agreeableness between 0 and 100),
  neuroticism       numeric check (neuroticism between 0 and 100),
  -- How many user messages have been analysed so far
  message_count     integer not null default 0,
  updated_at        timestamptz not null default now()
);

-- Users can only read and write their own profile row
alter table public.profiles enable row level security;

create policy "profiles: own row only"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
