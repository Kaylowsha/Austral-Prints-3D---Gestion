-- Link orders to a specific inventory item (roll of filament)
alter table public.orders 
  add column if not exists inventory_id uuid references public.inventory(id);

-- Create a view for easy consumption analysis
create or replace view material_consumption_stats as
select 
  i.name as material_name,
  i.color,
  i.brand,
  count(o.id) as total_orders,
  sum(p.weight_grams) as total_grams_used,
  sum(o.price) as total_revenue
from public.inventory i
left join public.orders o on o.inventory_id = i.id
left join public.products p on o.product_id = p.id
where i.type = 'Filamento'
group by i.id, i.name, i.color, i.brand;
