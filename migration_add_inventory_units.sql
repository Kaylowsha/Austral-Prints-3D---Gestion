-- Migration: Add unit-based measurement support to inventory
-- This allows tracking materials by units (for parts/accessories) in addition to grams (for filament/resin)

-- Add measurement unit columns
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS measurement_unit TEXT DEFAULT 'grams' CHECK (measurement_unit IN ('grams', 'units')),
  ADD COLUMN IF NOT EXISTS stock_units INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC DEFAULT 0;

-- Update existing records to explicitly use 'grams' measurement
UPDATE public.inventory 
SET measurement_unit = 'grams' 
WHERE measurement_unit IS NULL;

-- Add helpful comments
COMMENT ON COLUMN public.inventory.measurement_unit IS 'Unit of measurement: grams (for filament/resin) or units (for parts/accessories)';
COMMENT ON COLUMN public.inventory.stock_units IS 'Stock quantity when measurement_unit is units';
COMMENT ON COLUMN public.inventory.price_per_unit IS 'Price per unit when measurement_unit is units';
