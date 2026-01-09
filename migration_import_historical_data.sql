-- Inserción de Pedidos Históricos desde Planilla
-- Asumimos: Material PLA ($15.000/kg), Energía (100W, $50/kWh), Multiplicadores (1.5x y 3.0x)

insert into public.orders (
    description,
    price,
    suggested_price,
    cost,
    status,
    quantity,
    quoted_grams,
    quoted_hours,
    quoted_mins,
    quoted_power_watts,
    quoted_op_multiplier,
    quoted_sales_multiplier,
    quoted_material_price,
    custom_client_name,
    created_at
) values
-- 1. CR7 (Cata)
('CR7', 12000, 5846, 1948, 'entregado', 1, 85, 6, 30, 100, 1.5, 3.0, 15000, 'Cata', now() - interval '10 days'),
-- 2. Gato (Carmen)
('Gato', 10000, 10012, 3337, 'entregado', 1, 147, 4, 0, 100, 1.5, 3.0, 15000, 'Carmen', now() - interval '9 days'),
-- 3. Gato (Deyvis)
('Gato', 25000, 11952, 3984, 'entregado', 1, 175, 6, 10, 100, 1.5, 3.0, 15000, 'Deyvis', now() - interval '8 days'),
-- 4. Alianza (Jugadores)
('Alianza', 12000, 2920, 973, 'entregado', 1, 42, 3, 43, 100, 1.5, 3.0, 15000, 'Jugadores', now() - interval '7 days'),
-- 5. Alianza Adicionales (Leandro)
('Alianza Adicionales', 2000, 830, 276, 'entregado', 1, 12, 0, 54, 100, 1.5, 3.0, 15000, 'Leandro', now() - interval '6 days'),
-- 6. Llavero Temático (Gisela)
('Llavero Temático', 4000, 965, 321, 'entregado', 1, 14, 0, 54, 100, 1.5, 3.0, 15000, 'Gisela', now() - interval '5 days'),
-- 7. Llavero Temático (Pato Barría)
('Llavero Temático', 4000, 965, 321, 'entregado', 1, 14, 0, 54, 100, 1.5, 3.0, 15000, 'Pato Barría', now() - interval '5 days'),
-- 8. Llavero Temático (Nuvia)
('Llavero Temático', 4000, 965, 321, 'entregado', 1, 14, 0, 54, 100, 1.5, 3.0, 15000, 'Nuvia', now() - interval '5 days'),
-- 9. Alianza Dani (Dani)
('Alianza Dani', 10000, 1539, 513, 'entregado', 1, 22, 2, 24, 100, 1.5, 3.0, 15000, 'Dani', now() - interval '4 days'),
-- 10. CR7 (Gisela)
('CR7', 30000, 25065, 8355, 'entregado', 1, 368, 10, 0, 100, 1.5, 3.0, 15000, 'Gisela', now() - interval '3 days'),
-- 11. SUP (Pato Castro)
('SUP', 8000, 3577, 1192, 'entregado', 1, 52, 3, 0, 100, 1.5, 3.0, 15000, 'Pato Castro', now() - interval '2 days'),
-- 12. Piocha (Quelen)
('Piocha', 6000, 2092, 697, 'entregado', 1, 30, 3, 0, 100, 1.5, 3.0, 15000, 'Quelen', now() - interval '1 day');
