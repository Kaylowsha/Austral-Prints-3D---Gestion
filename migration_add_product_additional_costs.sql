-- Migration: Add additional costs field to products
-- This allows defining default extra costs (chains, magnets, etc.) for each product model

alter table public.products 
  add column if not exists additional_costs jsonb default '[]'::jsonb;

comment on column public.products.additional_costs is 'Default array of additional costs [{description: string, amount: number}] for this product';
