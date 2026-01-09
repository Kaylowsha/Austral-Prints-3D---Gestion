-- Migration: Add quotation technical details to orders
-- This allows orders to be editable and recalculated based on weight/time/material

alter table public.orders 
  add column if not exists quoted_grams integer default 0,
  add column if not exists quoted_hours integer default 0,
  add column if not exists quoted_mins integer default 0,
  add column if not exists quoted_power_watts integer default 100,
  add column if not exists quoted_op_multiplier numeric default 1.5,
  add column if not exists quoted_sales_multiplier numeric default 3.0,
  add column if not exists quoted_material_price numeric default 0;

-- Comment for future maintainers
comment on column public.orders.quoted_grams is 'Grams of material used for this specific order quote';
comment on column public.orders.quoted_hours is 'Hours of printing time for this order';
