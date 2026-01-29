-- Migration: Add additional costs field to orders
-- This allows adding extra costs (shipping, packaging, etc.) that are not subject to operational or sales multipliers
-- These costs are added directly to the suggested price

alter table public.orders 
  add column if not exists additional_costs jsonb default '[]'::jsonb;

-- Comment for future maintainers
comment on column public.orders.additional_costs is 'Array of additional costs [{description: string, amount: number}] that are added to the suggested price without multipliers';
