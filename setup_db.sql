-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Clients Table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text not null,
  phone text,
  email text,
  user_id uuid references auth.users(id) default auth.uid()
);

-- 2. Products Table (Catalog)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  base_price numeric default 0,
  weight_grams integer default 0,
  print_time_mins integer default 0,
  user_id uuid references auth.users(id) default auth.uid()
);

-- 3. Inventory Table
create table public.inventory (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  type text check (type in ('Filamento', 'Resina', 'Repuesto', 'Otro')),
  stock_grams integer default 0,
  status text check (status in ('disponible', 'bajo_stock', 'agotado')) default 'disponible',
  user_id uuid references auth.users(id) default auth.uid()
);

-- 4. Expenses Table
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date default current_date,
  category text check (category in ('materiales', 'mantenimiento', 'servicios', 'otros')),
  amount numeric not null,
  description text,
  user_id uuid references auth.users(id) default auth.uid()
);

-- 5. Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id),
  description text not null,
  status text check (status in ('pendiente', 'en_proceso', 'terminado', 'entregado', 'cancelado')) default 'pendiente',
  price numeric default 0,
  cost numeric default 0,
  deadline date,
  user_id uuid references auth.users(id) default auth.uid()
);

-- Enable RLS (Row Level Security) on all tables
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.expenses enable row level security;
alter table public.orders enable row level security;

-- Create policies to allow authenticated users to see/edit mostly everything (since it's internal tool)
-- For simplicity, we allow ALL actions if the user is authenticated. 
-- In a stricter app, we would match user_id = auth.uid(), but assuming shared admin access:

create policy "Enable all access for authenticated users" on public.clients for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.products for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.inventory for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.expenses for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.orders for all using (auth.role() = 'authenticated');
