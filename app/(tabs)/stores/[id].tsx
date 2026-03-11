import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Card, DataTable, Dialog, Portal, Snackbar, Text } from 'react-native-paper';

import { AppScreen } from '@/components/AppScreen';
import { LoadingOrError } from '@/components/LoadingOrError';
import { StoreForm } from '@/features/stores/StoreForm';
import { useDeleteStore, useSaveStore, useStoreLatestPrices, useStores } from '@/features/stores/hooks';
import { toUserErrorMessage } from '@/lib/errors';
import { formatCurrencyArs, formatDateAr } from '@/lib/format';

export default function StoreDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useStores();
  const { data: priceRows, isLoading: pricesLoading, error: pricesError } = useStoreLatestPrices(id ?? '');
  const save = useSaveStore();
  const remove = useDeleteStore();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const store = data?.find((s) => s.id === id);

  return (
    <AppScreen title="Detalle de tienda">
      <LoadingOrError isLoading={isLoading} error={error} />
      {store && (
        <StoreForm
          defaultValues={{
            name: store.name,
            description: store.description ?? '',
            address: store.address ?? '',
            phone: store.phone ?? '',
            notes: store.notes ?? '',
          }}
          onSubmit={async (values) => {
            try {
              await save.mutateAsync({
                id: store.id,
                name: values.name,
                description: values.description?.trim() ? values.description.trim() : null,
                address: values.address?.trim() ? values.address.trim() : null,
                phone: values.phone?.trim() ? values.phone.trim() : null,
                notes: values.notes?.trim() ? values.notes.trim() : null,
              });
              setMessage('Tienda guardada.');
            } catch (saveError) {
              setMessage(toUserErrorMessage(saveError, 'No se pudo guardar la tienda.'));
            }
          }}
        />
      )}

      {store && (
        <Button mode="outlined" textColor="#B3261E" onPress={() => setConfirmDelete(true)} disabled={remove.isPending}>
          Borrar tienda
        </Button>
      )}

      <Card mode="outlined">
        <Card.Title title="Materiales y precios en esta tienda" />
        <Card.Content>
          <LoadingOrError isLoading={pricesLoading} error={pricesError ? new Error(pricesError.message) : null} />
          {!pricesLoading && (priceRows?.length ?? 0) === 0 && <Text>No hay materiales asociados con precio en esta tienda.</Text>}
          {(priceRows?.length ?? 0) > 0 && (
            <ScrollView horizontal>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ minWidth: 220 }}>Material</DataTable.Title>
                  <DataTable.Title numeric style={{ minWidth: 140 }}>
                    Precio
                  </DataTable.Title>
                  <DataTable.Title style={{ minWidth: 140 }}>Fecha</DataTable.Title>
                </DataTable.Header>

                {priceRows?.map((row) => (
                  <DataTable.Row key={row.id}>
                    <DataTable.Cell style={{ minWidth: 220 }}>{row.item_name}</DataTable.Cell>
                    <DataTable.Cell numeric style={{ minWidth: 140 }}>
                      {formatCurrencyArs(row.price)}
                    </DataTable.Cell>
                    <DataTable.Cell style={{ minWidth: 140 }}>{formatDateAr(row.observed_at)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </ScrollView>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={confirmDelete} onDismiss={() => !remove.isPending && setConfirmDelete(false)}>
          <Dialog.Title>Borrar tienda</Dialog.Title>
          <Dialog.Content>
            <Text>Se intentara borrar la tienda y sus referencias directas.</Text>
            <Text>Si tiene precios historicos asociados, Supabase puede bloquear el borrado por integridad.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={remove.isPending} onPress={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              loading={remove.isPending}
              textColor="#B3261E"
              onPress={async () => {
                if (!store) return;
                try {
                  await remove.mutateAsync(store.id);
                  setConfirmDelete(false);
                  router.back();
                } catch (deleteError) {
                  setConfirmDelete(false);
                  setMessage(toUserErrorMessage(deleteError, 'No se pudo borrar la tienda. Si tiene datos vinculados, elimina primero esas referencias.'));
                }
              }}
            >
              Borrar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage(null)}>
        {message}
      </Snackbar>
    </AppScreen>
  );
}
