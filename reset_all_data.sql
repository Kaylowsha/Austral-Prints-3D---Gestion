-- Limpiar todas las tablas relacionadas con la gestión
-- IMPORTANTE: Esto borrará productos, inventario, pedidos y gastos.
DELETE FROM orders;
DELETE FROM expenses;
DELETE FROM inventory;
DELETE FROM products;

-- Reiniciar secuencias si existen (opcional en Supabase)
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;
-- ALTER SEQUENCE expenses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE inventory_id_seq RESTART WITH 1;
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;
