-- Add quantity column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Update existing orders to have quantity 1 if they are null
UPDATE public.orders SET quantity = 1 WHERE quantity IS NULL;
