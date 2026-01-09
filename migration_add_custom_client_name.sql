-- Migration: Permitir nombres de clientes manuales
alter table public.orders 
  add column if not exists custom_client_name text;

comment on column public.orders.custom_client_name is 'Nombre del cliente ingresado manualmente si no se selecciona uno de la lista';
