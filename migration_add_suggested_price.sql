-- Migration: Separar Precio Sugerido de Precio Cobrado
alter table public.orders 
  add column if not exists suggested_price numeric default 0;

comment on column public.orders.suggested_price is 'El precio calculado técnicamente por la app (antes de descuentos o redondeos comerciales)';
