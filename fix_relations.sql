-- Add explicit foreign keys to profiles to enable Joins
alter table public.orders 
  add constraint orders_user_id_fkey_profiles 
  foreign key (user_id) references public.profiles(id);

alter table public.expenses 
  add constraint expenses_user_id_fkey_profiles 
  foreign key (user_id) references public.profiles(id);

alter table public.audit_logs 
  add constraint audit_logs_user_id_fkey_profiles 
  foreign key (user_id) references public.profiles(id);

-- Ensure all existing users have a profile
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
