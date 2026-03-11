-- Iteracion 4: vinculo trabajos-calendario + notas de materiales

alter table public.items
add column if not exists notes text;

alter table public.appointments
add column if not exists quote_id uuid references public.quotes(id) on delete set null;

create index if not exists appointments_quote_id_idx
  on public.appointments(quote_id)
  where quote_id is not null;

create unique index if not exists appointments_unique_quote_id_idx
  on public.appointments(quote_id)
  where quote_id is not null;

create or replace function public.validate_appointment_integrity()
returns trigger
language plpgsql
as $$
declare
  store_ok boolean;
  quote_owner uuid;
begin
  if new.user_id <> auth.uid() then
    raise exception 'user_id must match authenticated user';
  end if;

  if new.quote_id is not null then
    select q.user_id into quote_owner
    from public.quotes q
    where q.id = new.quote_id;

    if quote_owner is null then
      raise exception 'Quote not found';
    end if;

    if quote_owner <> auth.uid() then
      raise exception 'Quote invalid for current user';
    end if;
  end if;

  if new.store_id is not null then
    select exists(
      select 1 from public.stores s
      where s.id = new.store_id and s.user_id = auth.uid()
    ) into store_ok;

    if not store_ok then
      raise exception 'Store invalid for current user';
    end if;
  end if;

  return new;
end;
$$;
