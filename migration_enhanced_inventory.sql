-- Add more details to inventory
alter table public.inventory 
  add column if not exists color text,
  add column if not exists brand text,
  add column if not exists material_type text default 'PLA';

-- Update check constraint if needed
-- alter table public.inventory drop constraint if exists inventory_type_check;
-- alter table public.inventory add constraint inventory_type_check check (type in ('Filamento', 'Resina', 'Repuesto', 'Otro'));
