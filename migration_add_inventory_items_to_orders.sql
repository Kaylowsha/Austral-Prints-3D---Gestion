-- Migration: Add inventory items tracking to orders and products
-- This allows tracking which inventory items (beyond filament) are used in orders/products
-- and automatically calculating their costs

-- Add inventory items to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS inventory_items JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.orders.inventory_items IS 'Array of inventory items used [{inventory_id: uuid, name: string, quantity: number, calculated_cost: number}]';

-- Add inventory items to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS inventory_items JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.inventory_items IS 'Array of inventory items used [{inventory_id: uuid, name: string, quantity: number, calculated_cost: number}]';
