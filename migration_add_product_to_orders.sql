-- Add product_id to orders table
alter table public.orders 
add column product_id uuid references public.products(id);

-- Optional: Index for faster lookups
create index if not exists idx_orders_product_id on public.orders(product_id);
