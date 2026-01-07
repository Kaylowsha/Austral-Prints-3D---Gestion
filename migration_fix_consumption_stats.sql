-- Actualizar la vista de estadísticas de consumo para que sea precisa
create or replace view material_consumption_stats as
select 
  i.name as material_name,
  i.color,
  i.brand,
  count(o.id) filter (where o.status != 'cancelado') as total_orders,
  sum(p.weight_grams * coalesce(o.quantity, 1)) filter (where o.status != 'cancelado') as total_grams_used,
  sum(o.price) filter (where o.status in ('terminado', 'entregado')) as total_revenue
from public.inventory i
left join public.orders o on o.inventory_id = i.id
left join public.products p on o.product_id = p.id
where i.type = 'Filamento'
group by i.id, i.name, i.color, i.brand;
