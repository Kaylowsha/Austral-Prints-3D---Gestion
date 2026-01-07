-- Add date column to orders
alter table public.orders 
add column if not exists date date default current_date;

-- Update expenses check constraint (PostgreSQL doesn't allow direct update of check constraints easily without drop/add)
alter table public.expenses 
drop constraint if exists expenses_category_check;

alter table public.expenses 
add constraint expenses_category_check 
check (category in ('materiales', 'mantenimiento', 'servicios', 'otros', 'retiro', 'inversion'));
