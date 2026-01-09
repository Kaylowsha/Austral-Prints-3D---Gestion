-- Migration: Añadir precio por kilo al inventario para cálculos de cotización
alter table public.inventory 
  add column if not exists price_per_kg numeric default 15000;

comment on column public.inventory.price_per_kg is 'Precio de compra por cada 1000g de material';
