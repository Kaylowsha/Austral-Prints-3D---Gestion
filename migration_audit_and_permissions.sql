-- 1. Create Audit Logs Table
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) default auth.uid(),
  action text not null, -- e.g., 'CREATE', 'DELETE', 'UPDATE'
  table_name text not null,
  record_id uuid,
  details jsonb
);

-- Enable RLS on audit_logs
alter table public.audit_logs enable row level security;
create policy "Enable all access for authenticated users" on public.audit_logs for all using (auth.role() = 'authenticated');

-- 2. Update RLS for Deletion (only author can delete)
-- We need to drop the generic "Enable all access" policies and create more specific ones for DELETE

-- For Clients
drop policy if exists "Enable all access for authenticated users" on public.clients;
create policy "Authenticated users can select/insert" on public.clients for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert" on public.clients for insert with check (auth.role() = 'authenticated');
create policy "Only owner can delete clients" on public.clients for delete using (auth.uid() = user_id);
create policy "Only owner can update clients" on public.clients for update using (auth.uid() = user_id);

-- For Products
drop policy if exists "Enable all access for authenticated users" on public.products;
create policy "Authenticated users can select products" on public.products for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert products" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Only owner can delete products" on public.products for delete using (auth.uid() = user_id);
create policy "Only owner can update products" on public.products for update using (auth.uid() = user_id);

-- For Expenses
drop policy if exists "Enable all access for authenticated users" on public.expenses;
create policy "Authenticated users can select expenses" on public.expenses for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert expenses" on public.expenses for insert with check (auth.role() = 'authenticated');
create policy "Only owner can delete expenses" on public.expenses for delete using (auth.uid() = user_id);
create policy "Only owner can update expenses" on public.expenses for update using (auth.uid() = user_id);

-- For Orders
drop policy if exists "Enable all access for authenticated users" on public.orders;
create policy "Authenticated users can select orders" on public.orders for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert orders" on public.orders for insert with check (auth.role() = 'authenticated');
create policy "Only owner can delete orders" on public.orders for delete using (auth.uid() = user_id);
create policy "Only owner can update orders" on public.orders for update using (auth.uid() = user_id);
