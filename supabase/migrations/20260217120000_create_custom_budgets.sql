create table if not exists public.custom_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  categories text[] not null,
  limit_type text check (limit_type in ('value', 'percentage')) not null,
  limit_value numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.custom_budgets enable row level security;

create policy "Users can view their own custom budgets"
  on public.custom_budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own custom budgets"
  on public.custom_budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own custom budgets"
  on public.custom_budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own custom budgets"
  on public.custom_budgets for delete
  using (auth.uid() = user_id);
