-- Migration: Reparar restricción de eliminación en inventario
-- Permite borrar materiales aunque tengan pedidos asociados (la referencia en el pedido pasará a ser NULL)

-- 1. Buscamos el nombre de la restricción (por defecto suele ser orders_inventory_id_fkey)
-- 2. La eliminamos y recreamos con ON DELETE SET NULL

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_inventory_id_fkey'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_inventory_id_fkey;
    END IF;
END $$;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_inventory_id_fkey 
FOREIGN KEY (inventory_id) 
REFERENCES public.inventory(id) 
ON DELETE SET NULL;
