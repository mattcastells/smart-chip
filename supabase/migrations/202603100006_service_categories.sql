-- Iteracion 6: categorias administrables para servicios.

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_categories_user_name_unique unique (user_id, name)
);

create trigger service_categories_set_updated_at
before update on public.service_categories
for each row execute function public.set_updated_at();

create trigger service_categories_set_user_id
before insert on public.service_categories
for each row execute function public.set_user_id_default();

create index service_categories_user_name_idx on public.service_categories(user_id, name);

alter table public.service_categories enable row level security;

create policy "service_categories_select_own"
on public.service_categories
for select
using (user_id = auth.uid());

create policy "service_categories_insert_own"
on public.service_categories
for insert
with check (user_id = auth.uid());

create policy "service_categories_update_own"
on public.service_categories
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "service_categories_delete_own"
on public.service_categories
for delete
using (user_id = auth.uid());

-- Backfill de categorias existentes en services.
insert into public.service_categories (user_id, name)
select s.user_id, trim(s.category)
from public.services s
where s.category is not null and char_length(trim(s.category)) > 0
group by s.user_id, trim(s.category)
on conflict (user_id, name) do nothing;
