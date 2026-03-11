-- Reset total de datos operativos para entorno de pruebas.
-- ADVERTENCIA: borra datos de todas las cuentas en estas tablas.
-- No toca auth.users.

do $$
begin
  if to_regclass('public.appointments') is not null then
    execute 'delete from public.appointments';
  end if;

  if to_regclass('public.quote_material_items') is not null then
    execute 'delete from public.quote_material_items';
  end if;

  if to_regclass('public.quote_service_items') is not null then
    execute 'delete from public.quote_service_items';
  end if;

  if to_regclass('public.quotes') is not null then
    execute 'delete from public.quotes';
  end if;

  if to_regclass('public.store_item_prices') is not null then
    execute 'delete from public.store_item_prices';
  end if;

  if to_regclass('public.items') is not null then
    execute 'delete from public.items';
  end if;

  if to_regclass('public.stores') is not null then
    execute 'delete from public.stores';
  end if;

  if to_regclass('public.services') is not null then
    execute 'delete from public.services';
  end if;

  if to_regclass('public.service_categories') is not null then
    execute 'delete from public.service_categories';
  end if;

  if to_regclass('public.profiles') is not null then
    execute 'delete from public.profiles';
  end if;
end $$;
