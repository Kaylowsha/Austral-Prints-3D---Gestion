create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  type text not null, -- 'Impresora', 'Herramienta', 'Mobiliario', 'Insumo', 'Otro'
  acquisition_date date,
  acquisition_cost numeric default 0,
  current_value numeric default 0,
  active boolean default true,
  user_id uuid references auth.users(id)
);

-- Enable RLS
alter table public.assets enable row level security;

-- Create policies
create policy "Users can view their own assets"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own assets"
  on public.assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own assets"
  on public.assets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own assets"
  on public.assets for delete
  using (auth.uid() = user_id);
