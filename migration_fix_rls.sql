-- Fix RLS for Orders and ensure seeded data is accessible
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.orders;

CREATE POLICY "Enable all access for authenticated users" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Ensure other tables have similar permissive policies for debugging
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.products;
CREATE POLICY "Enable all access for authenticated users" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.inventory;
CREATE POLICY "Enable all access for authenticated users" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.expenses;
CREATE POLICY "Enable all access for authenticated users" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
