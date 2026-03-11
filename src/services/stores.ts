import { supabase } from '@/lib/supabase';
import type { LatestStoreItemPrice, Store } from '@/types/db';

export const listStores = async (): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
};

export const upsertStore = async (payload: Partial<Store> & { name: string }): Promise<Store> => {
  const { data, error } = await supabase.from('stores').upsert(payload).select().single();
  if (error) throw error;
  return data;
};

export const deleteStore = async (storeId: string): Promise<void> => {
  const { error } = await supabase.from('stores').delete().eq('id', storeId);
  if (error) throw error;
};

export const listStoreLatestPrices = async (storeId: string): Promise<LatestStoreItemPrice[]> => {
  const { data, error } = await supabase
    .from('latest_store_item_prices')
    .select('*')
    .eq('store_id', storeId)
    .order('item_name');
  if (error) throw error;
  return data;
};
