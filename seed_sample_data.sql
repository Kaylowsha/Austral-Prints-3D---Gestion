-- Semilla de datos para verificar lógica financiera (Real vs Flotante)
-- Asegúrate de estar logueado en la app o reemplazar auth.uid() si es necesario.

DO $$
DECLARE
    uid UUID := auth.uid(); -- Obtiene tu ID de usuario de Supabase
    prod_llavero_id UUID;
    prod_soporte_id UUID;
    prod_vaso_id UUID;
    inv_pla_negro UUID;
    inv_pla_rojo UUID;
BEGIN
    -- 1. Insertar Productos
    INSERT INTO products (name, base_price, weight_grams, print_time_mins, user_id)
    VALUES ('Llavero Personalizado', 2000, 15, 45, uid) RETURNING id INTO prod_llavero_id;
    
    INSERT INTO products (name, base_price, weight_grams, print_time_mins, user_id)
    VALUES ('Soporte Celular Pro', 8000, 85, 240, uid) RETURNING id INTO prod_soporte_id;
    
    INSERT INTO products (name, base_price, weight_grams, print_time_mins, user_id)
    VALUES ('Vaso Vikingo', 15000, 150, 600, uid) RETURNING id INTO prod_vaso_id;

    -- 2. Insertar Inventario
    INSERT INTO inventory (name, brand, color, material_type, stock_grams, type, status, user_id)
    VALUES ('PLA Negro Mate', 'eSun', 'Black', 'PLA', 1000, 'Filamento', 'disponible', uid) RETURNING id INTO inv_pla_negro;
    
    INSERT INTO inventory (name, brand, color, material_type, stock_grams, type, status, user_id)
    VALUES ('PLA Rojo Seda', 'Creality', 'Red', 'PLA', 1000, 'Filamento', 'disponible', uid) RETURNING id INTO inv_pla_rojo;

    -- 3. Insertar Pedidos (TOTAL ESPERADO: 10)
    
    -- REALIZADOS (Deberían sumar al Balance Real)
    -- Pedido 1: 5 Llaveros, Terminados. $10.000 total.
    INSERT INTO orders (product_id, inventory_id, description, status, price, cost, quantity, date, user_id)
    VALUES (prod_llavero_id, inv_pla_negro, '5 llaveros para empresa', 'terminado', 10000, 1500, 5, CURRENT_DATE, uid);
    
    -- Pedido 2: 1 Soporte, Entregado. $8.000 total.
    INSERT INTO orders (product_id, inventory_id, description, status, price, cost, quantity, date, user_id)
    VALUES (prod_soporte_id, inv_pla_negro, 'Soporte color negro', 'entregado', 8000, 1700, 1, CURRENT_DATE - 1, uid);
    
    -- Pedido 3: 1 Llavero, Terminado. $2.000 total.
    INSERT INTO orders (product_id, inventory_id, description, status, price, cost, quantity, date, user_id)
    VALUES (prod_llavero_id, inv_pla_rojo, 'Llavero rojo suelto', 'terminado', 2000, 300, 1, CURRENT_DATE, uid);

    -- FLOTANTES (Deberían aparecer solo en Flotante)
    -- Pedido 4: 20 Llaveros, Pendientes. $40.000 total. (TU EJEMPLO)
    INSERT INTO orders (product_id, inventory_id, description, status, price, cost, quantity, date, user_id)
    VALUES (prod_llavero_id, inv_pla_negro, 'Los 20 llaveros del problema', 'pendiente', 40000, 6000, 20, CURRENT_DATE, uid);
    
    -- Pedido 5: 1 Vaso, En Proceso. $15.000 total.
    INSERT INTO orders (product_id, inventory_id, description, status, price, cost, quantity, date, user_id)
    VALUES (prod_vaso_id, inv_pla_rojo, 'Vaso en impresión', 'en_proceso', 15000, 3000, 1, CURRENT_DATE, uid);
    
    -- Pedido 6: 2 Soportes, Pendientes. $16.000 total.
    INSERT INTO orders (product_id, inventory_id, description, status, price, cost, quantity, date, user_id)
    VALUES (prod_soporte_id, inv_pla_negro, 'Soportes para oficina', 'pendiente', 16000, 3400, 2, CURRENT_DATE, uid);

    -- OTROS ESTADOS (No suman a nada operativo)
    -- Pedido 7: Cancelado
    INSERT INTO orders (product_id, inventory_id, description, status, price, cost, quantity, date, user_id)
    VALUES (prod_llavero_id, inv_pla_negro, 'Pedido arrepentido', 'cancelado', 2000, 300, 1, CURRENT_DATE, uid);

    -- PEDIDO SIN PRODUCTO (Inyección de Capital)
    -- Pedido 8: Inyección manual de $50.000
    INSERT INTO orders (product_id, description, status, price, cost, quantity, date, user_id)
    VALUES (NULL, 'Inyección inicial capital', 'terminado', 50000, 0, 1, CURRENT_DATE - 5, uid);

    -- 4. GASTOS
    -- Gasto Operativo: Luz ($15.000)
    INSERT INTO expenses (date, category, amount, description, user_id)
    VALUES (CURRENT_DATE - 2, 'servicios', 15000, 'Cuenta de Luz', uid);
    
    -- Gasto Inversión: Nueva Boquilla ($10.000) -> Suma a Inyecciones en dashboard
    INSERT INTO expenses (date, category, amount, description, user_id)
    VALUES (CURRENT_DATE - 3, 'inversion', 10000, 'Boquillas endurecidas', uid);
    
    -- Gasto Retiro: Retiro Socio ($20.000)
    INSERT INTO expenses (date, category, amount, description, user_id)
    VALUES (CURRENT_DATE - 1, 'retiro', 20000, 'Almuerzo socios', uid);

END $$;

/* 
RESUMEN DE CUADRE ESPERADO:
Ingresos Reales (terminado/entregado): 10.000 + 8.000 + 2.000 = $20.000
Ingresos Flotantes (pendiente/en_proceso): 40.000 + 15.000 + 16.000 = $71.000
Gastos Operativos: 15.000 (luz)
Costos de Producción (de los Reales): 1500 + 1700 + 300 = $3500
Utilidad Neta: 20.000 - 15.000 - 3500 = $1500
Inyecciones: 50.000 (pedido) + 10.000 (gasto inversion) = $60.000
Retiros: $20.000
Balance de Caja: 1500 + 60.000 - 20.000 = $41.500
*/
