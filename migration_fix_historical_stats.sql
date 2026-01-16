-- Migration: Fix Historical Stats and Inventory Linking

-- 1. Update the View to handle cases without Product ID (using quoted_grams)
create or replace view material_consumption_stats as
select 
  i.name as material_name,
  i.color,
  i.brand,
  count(o.id) filter (where o.status != 'cancelado') as total_orders,
  sum(
    coalesce(p.weight_grams * coalesce(o.quantity, 1), o.quoted_grams, 0)
  ) filter (where o.status != 'cancelado') as total_grams_used,
  sum(o.price) filter (where o.status in ('terminado', 'entregado')) as total_revenue
from public.inventory i
left join public.orders o on o.inventory_id = i.id
left join public.products p on o.product_id = p.id
where i.type = 'Filamento'
group by i.id, i.name, i.color, i.brand;

-- 2. Create Generic Material for Historical Data if not exists and link orphans
DO $$
DECLARE
    hist_id uuid;
BEGIN
    -- Check if exists
    SELECT id INTO hist_id FROM public.inventory WHERE name = 'Material Histórico' LIMIT 1;
    
    -- Create if not
    IF hist_id IS NULL THEN
        INSERT INTO public.inventory (name, brand, color, material_type, type, stock_grams, price_per_kg, status)
        VALUES ('Material Histórico', 'Genérico', 'Varios', 'PLA', 'Filamento', 0, 15000, 'disponible')
        RETURNING id INTO hist_id;
    END IF;

    -- Update orphaned orders (no inventory_id) to use this generic material
    UPDATE public.orders 
    SET inventory_id = hist_id
    WHERE inventory_id IS NULL;
    
END $$;
