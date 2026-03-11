-- Iteracion 5: eliminar archivado logico (is_active)

-- Reemplaza validaciones para no depender de is_active.
create or replace function public.validate_store_item_price_integrity()
returns trigger
language plpgsql
as $$
declare
  store_ok boolean;
  item_ok boolean;
begin
  select exists(
    select 1 from public.stores s
    where s.id = new.store_id and s.user_id = auth.uid()
  ) into store_ok;

  if not store_ok then
    raise exception 'Store invalid for current user';
  end if;

  select exists(
    select 1 from public.items i
    where i.id = new.item_id and i.user_id = auth.uid()
  ) into item_ok;

  if not item_ok then
    raise exception 'Item invalid for current user';
  end if;

  if new.user_id <> auth.uid() then
    raise exception 'user_id must match authenticated user';
  end if;

  return new;
end;
$$;

create or replace function public.validate_quote_material_item_integrity()
returns trigger
language plpgsql
as $$
declare
  quote_owner uuid;
  item_ok boolean;
  store_ok boolean;
begin
  select q.user_id into quote_owner
  from public.quotes q
  where q.id = new.quote_id;

  if quote_owner is null then
    raise exception 'Quote not found';
  end if;

  if new.user_id <> auth.uid() then
    raise exception 'user_id must match authenticated user';
  end if;

  if quote_owner <> new.user_id then
    raise exception 'Quote user mismatch';
  end if;

  select exists (
    select 1 from public.items i
    where i.id = new.item_id and i.user_id = auth.uid()
  ) into item_ok;

  if not item_ok then
    raise exception 'Item invalid for current user';
  end if;

  if new.source_store_id is not null then
    select exists (
      select 1 from public.stores s
      where s.id = new.source_store_id and s.user_id = auth.uid()
    ) into store_ok;

    if not store_ok then
      raise exception 'Source store invalid for current user';
    end if;
  end if;

  new.total_price = round((new.quantity * new.unit_price)::numeric, 2);
  return new;
end;
$$;

create or replace function public.validate_quote_service_item_integrity()
returns trigger
language plpgsql
as $$
declare
  quote_owner uuid;
  service_ok boolean;
begin
  select q.user_id into quote_owner
  from public.quotes q
  where q.id = new.quote_id;

  if quote_owner is null then
    raise exception 'Quote not found';
  end if;

  if new.user_id <> auth.uid() then
    raise exception 'user_id must match authenticated user';
  end if;

  if quote_owner <> new.user_id then
    raise exception 'Quote user mismatch';
  end if;

  select exists (
    select 1 from public.services s
    where s.id = new.service_id and s.user_id = auth.uid()
  ) into service_ok;

  if not service_ok then
    raise exception 'Service invalid for current user';
  end if;

  new.total_price = round((new.quantity * new.unit_price)::numeric, 2);
  return new;
end;
$$;

-- Ajuste de indices.
drop index if exists public.stores_user_id_idx;
drop index if exists public.items_user_id_idx;
drop index if exists public.services_user_active_name_idx;

create index if not exists stores_user_id_idx on public.stores(user_id, name);
create index if not exists items_user_id_idx on public.items(user_id, name);
create index if not exists services_user_name_idx on public.services(user_id, name);

-- Eliminacion de columnas de archivado.
alter table public.profiles drop column if exists is_active;
alter table public.stores drop column if exists is_active;
alter table public.items drop column if exists is_active;
alter table public.services drop column if exists is_active;
