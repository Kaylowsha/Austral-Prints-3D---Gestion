-- Add tags column to orders and expenses
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Index for better filtering performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_orders_tags ON public.orders USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_expenses_tags ON public.expenses USING GIN (tags);
