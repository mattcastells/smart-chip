import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Button, Card, Snackbar, Text, TextInput } from 'react-native-paper';

import { AppScreen } from '@/components/AppScreen';
import { LoadingOrError } from '@/components/LoadingOrError';
import { useDeleteAppointment, useUpsertQuoteAppointment } from '@/features/appointments/hooks';
import { ConfirmDeleteDialog } from '@/features/quotes/components/ConfirmDeleteDialog';
import { QuoteMaterialItemCard } from '@/features/quotes/components/QuoteMaterialItemCard';
import { QuoteServiceItemCard } from '@/features/quotes/components/QuoteServiceItemCard';
import { QuoteTotalsSummary } from '@/features/quotes/components/QuoteTotalsSummary';
import { exportQuotePdf } from '@/features/quotes/exportPdf';
import { QuoteForm } from '@/features/quotes/QuoteForm';
import {
  useDeleteQuoteMaterialItem,
  useDeleteQuoteServiceItem,
  useDuplicateQuoteMaterialItem,
  useDuplicateQuoteServiceItem,
  useQuoteDetail,
  useSaveQuote,
  useUpdateQuoteMaterialItem,
  useUpdateQuoteServiceItem,
} from '@/features/quotes/hooks';
import { useStores } from '@/features/stores/hooks';
import { toUserErrorMessage } from '@/lib/errors';
import { formatCurrencyArs } from '@/lib/format';

const formatDateForInput = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateInput = (value: string): string => {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error('La fecha debe tener formato YYYY-MM-DD.');
  }

  const [rawYear, rawMonth, rawDay] = trimmed.split('-');
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('La fecha ingresada no es valida.');
  }

  return trimmed;
};

const normalizeTimeInput = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
    throw new Error('La hora debe tener formato HH:mm.');
  }

  return `${trimmed}:00`;
};

export default function QuoteDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useQuoteDetail(id);
  const { data: stores } = useStores();
  const save = useSaveQuote();
  const scheduleQuote = useUpsertQuoteAppointment();
  const deleteAppointment = useDeleteAppointment();
  const updateMaterial = useUpdateQuoteMaterialItem();
  const updateService = useUpdateQuoteServiceItem();
  const deleteMaterial = useDeleteQuoteMaterialItem();
  const deleteService = useDeleteQuoteServiceItem();
  const duplicateMaterial = useDuplicateQuoteMaterialItem();
  const duplicateService = useDuplicateQuoteServiceItem();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(formatDateForInput(new Date()));
  const [scheduleTime, setScheduleTime] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'material' | 'service'; id: string } | null>(null);

  useEffect(() => {
    if (!data) return;
    if (!data.appointment) {
      setScheduleDate(formatDateForInput(new Date()));
      setScheduleTime('');
      return;
    }

    setScheduleDate(data.appointment.scheduled_for);
    setScheduleTime(data.appointment.starts_at ? data.appointment.starts_at.slice(0, 5) : '');
  }, [data]);

  const isBusy =
    save.isPending ||
    scheduleQuote.isPending ||
    deleteAppointment.isPending ||
    updateMaterial.isPending ||
    updateService.isPending ||
    deleteMaterial.isPending ||
    deleteService.isPending ||
    duplicateMaterial.isPending ||
    duplicateService.isPending ||
    isExportingPdf;

  const saveCurrentJob = async () => {
    if (!data) return;
    try {
      await save.mutateAsync({
        id: data.quote.id,
        title: data.quote.title,
        client_name: data.quote.client_name,
        client_phone: data.quote.client_phone,
        notes: data.quote.notes,
        status: 'draft',
      });
      setSnack('Trabajo guardado.');
    } catch (mutationError) {
      setSnack(toUserErrorMessage(mutationError, 'No se pudo guardar el trabajo.'));
    }
  };

  const exportCurrentJobPdf = async () => {
    if (!data) return;
    try {
      setIsExportingPdf(true);
      await exportQuotePdf(data);
      setSnack('PDF generado.');
    } catch (exportError) {
      setSnack(toUserErrorMessage(exportError, 'No se pudo exportar el trabajo.'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const shareCurrentJobSummary = async () => {
    if (!data) return;
    try {
      const text = [
        `Trabajo: ${data.quote.title}`,
        `Cliente: ${data.quote.client_name}`,
        `Total: ${formatCurrencyArs(data.quote.total)}`,
        data.quote.notes ? `Notas: ${data.quote.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      await Share.share({
        title: 'Resumen de trabajo',
        message: text,
      });
    } catch (error) {
      setSnack(toUserErrorMessage(error, 'No se pudo compartir el resumen.'));
    }
  };

  const scheduleCurrentJob = async () => {
    if (!data) return;

    try {
      const normalizedDate = normalizeDateInput(scheduleDate);
      const normalizedTime = normalizeTimeInput(scheduleTime);

      await scheduleQuote.mutateAsync({
        quote_id: data.quote.id,
        title: `${data.quote.client_name} - ${data.quote.title}`,
        notes: data.quote.notes?.trim() ? data.quote.notes.trim() : null,
        scheduled_for: normalizedDate,
        starts_at: normalizedTime,
        ends_at: null,
        status: 'scheduled',
        store_id: null,
      });

      setSnack(data.appointment ? 'Trabajo reprogramado.' : 'Trabajo programado.');
    } catch (mutationError) {
      setSnack(toUserErrorMessage(mutationError, 'No se pudo programar el trabajo.'));
    }
  };

  const unscheduleCurrentJob = async () => {
    if (!data?.appointment?.id) return;
    try {
      await deleteAppointment.mutateAsync(data.appointment.id);
      setSnack('Trabajo quitado del calendario.');
    } catch (mutationError) {
      setSnack(toUserErrorMessage(mutationError, 'No se pudo quitar el trabajo del calendario.'));
    }
  };

  return (
    <AppScreen title="Detalle de trabajo">
      <LoadingOrError isLoading={isLoading} error={error} />
      {data && (
        <View style={styles.page}>
          <QuoteTotalsSummary
            subtotalMaterials={data.quote.subtotal_materials}
            subtotalServices={data.quote.subtotal_services}
            total={data.quote.total}
          />

          <Card mode="contained" style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text variant="titleMedium">Cabecera</Text>
              <QuoteForm
                defaultValues={{
                  client_name: data.quote.client_name,
                  client_phone: data.quote.client_phone ?? '',
                  title: data.quote.title,
                  notes: data.quote.notes ?? '',
                }}
                buttonLabel="Guardar cabecera"
                onSubmit={async (values) => {
                  try {
                    await save.mutateAsync({
                      id: data.quote.id,
                      title: values.title,
                      client_name: values.client_name,
                      client_phone: values.client_phone?.trim() ? values.client_phone.trim() : null,
                      notes: values.notes?.trim() ? values.notes.trim() : null,
                      status: 'draft',
                    });
                    setSnack('Cabecera guardada.');
                  } catch (mutationError) {
                    setSnack(toUserErrorMessage(mutationError, 'No se pudo guardar la cabecera.'));
                  }
                }}
              />
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text variant="titleMedium">Programacion</Text>
              {data.appointment ? (
                <Text>
                  Actualmente programado para {data.appointment.scheduled_for}
                  {data.appointment.starts_at ? ` a las ${data.appointment.starts_at.slice(0, 5)}` : ''}.
                </Text>
              ) : (
                <Text>Este trabajo aun no esta programado en el calendario.</Text>
              )}
              <TextInput
                mode="outlined"
                label="Fecha (YYYY-MM-DD)"
                value={scheduleDate}
                onChangeText={setScheduleDate}
                outlineStyle={styles.inputOutline}
              />
              <TextInput
                mode="outlined"
                label="Hora (HH:mm, opcional)"
                value={scheduleTime}
                onChangeText={setScheduleTime}
                outlineStyle={styles.inputOutline}
              />
              <View style={styles.actionsRow}>
                <Button
                  mode="contained"
                  icon="calendar-check-outline"
                  disabled={isBusy}
                  onPress={scheduleCurrentJob}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                >
                  {data.appointment ? 'Reprogramar trabajo' : 'Programar trabajo'}
                </Button>
                {data.appointment && (
                  <Button
                    mode="outlined"
                    textColor="#B3261E"
                    disabled={isBusy}
                    onPress={unscheduleCurrentJob}
                    style={styles.actionButton}
                    contentStyle={styles.actionButtonContent}
                  >
                    Quitar del calendario
                  </Button>
                )}
                <Link href="/(tabs)/calendar" asChild>
                  <Button mode="text">Ver calendario</Button>
                </Link>
              </View>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text variant="titleMedium">Acciones</Text>
              <View style={styles.actionsRow}>
                <Link href={{ pathname: '/quotes/[id]/add-service', params: { id: data.quote.id } }} asChild>
                  <Button mode="contained-tonal" disabled={isBusy} style={styles.actionButton} contentStyle={styles.actionButtonContent}>
                    Agregar servicio
                  </Button>
                </Link>
                <Link href={{ pathname: '/quotes/[id]/add-material', params: { id: data.quote.id } }} asChild>
                  <Button
                    mode="contained-tonal"
                    disabled={isBusy || data.services.length === 0}
                    style={styles.actionButton}
                    contentStyle={styles.actionButtonContent}
                  >
                    Agregar material
                  </Button>
                </Link>
                <Button
                  mode="contained"
                  icon="content-save-outline"
                  disabled={isBusy}
                  onPress={saveCurrentJob}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                >
                  Guardar trabajo
                </Button>
                <Button
                  mode="outlined"
                  icon="file-pdf-box"
                  loading={isExportingPdf}
                  disabled={isBusy}
                  onPress={exportCurrentJobPdf}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                >
                  Exportar / compartir PDF
                </Button>
                <Button
                  mode="outlined"
                  icon="share-variant-outline"
                  disabled={isBusy}
                  onPress={shareCurrentJobSummary}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                >
                  Compartir resumen
                </Button>
              </View>
              {data.services.length === 0 && (
                <Text style={styles.helperText}>Primero agrega un servicio para poder cargar materiales.</Text>
              )}
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text variant="titleMedium">Servicios</Text>
              {data.services.length === 0 && <Text>No hay servicios cargados.</Text>}
              <View style={styles.linesList}>
                {data.services.map((serviceLine) => (
                  <QuoteServiceItemCard
                    key={serviceLine.id}
                    item={serviceLine}
                    onSave={async (itemId, payload) => {
                      try {
                        await updateService.mutateAsync({ itemId, payload });
                        setSnack('Servicio actualizado.');
                      } catch (mutationError) {
                        setSnack(toUserErrorMessage(mutationError, 'No se pudo actualizar el servicio.'));
                      }
                    }}
                    onDuplicate={async (itemId) => {
                      try {
                        await duplicateService.mutateAsync(itemId);
                        setSnack('Servicio duplicado.');
                      } catch (mutationError) {
                        setSnack(toUserErrorMessage(mutationError, 'No se pudo duplicar el servicio.'));
                      }
                    }}
                    onDelete={(itemId) => setDeleteTarget({ kind: 'service', id: itemId })}
                    saving={updateService.isPending}
                    duplicating={duplicateService.isPending}
                    deleting={deleteService.isPending}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card mode="contained" style={styles.sectionCard}>
            <Card.Content style={styles.sectionContent}>
              <Text variant="titleMedium">Materiales</Text>
              {data.materials.length === 0 && <Text>No hay materiales cargados.</Text>}
              <View style={styles.linesList}>
                {data.materials.map((materialLine) => (
                  <QuoteMaterialItemCard
                    key={materialLine.id}
                    item={materialLine}
                    stores={stores ?? []}
                    onSave={async (itemId, payload) => {
                      try {
                        await updateMaterial.mutateAsync({ itemId, payload });
                        setSnack('Material actualizado.');
                      } catch (mutationError) {
                        setSnack(toUserErrorMessage(mutationError, 'No se pudo actualizar el material.'));
                      }
                    }}
                    onDuplicate={async (itemId) => {
                      try {
                        await duplicateMaterial.mutateAsync(itemId);
                        setSnack('Material duplicado.');
                      } catch (mutationError) {
                        setSnack(toUserErrorMessage(mutationError, 'No se pudo duplicar el material.'));
                      }
                    }}
                    onDelete={(itemId) => setDeleteTarget({ kind: 'material', id: itemId })}
                    saving={updateMaterial.isPending}
                    duplicating={duplicateMaterial.isPending}
                    deleting={deleteMaterial.isPending}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>

          <QuoteTotalsSummary
            subtotalMaterials={data.quote.subtotal_materials}
            subtotalServices={data.quote.subtotal_services}
            total={data.quote.total}
          />
        </View>
      )}

      <ConfirmDeleteDialog
        visible={Boolean(deleteTarget)}
        title="Eliminar linea"
        message="Seguro que queres eliminar esta linea del trabajo?"
        loading={deleteMaterial.isPending || deleteService.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            if (deleteTarget.kind === 'material') {
              await deleteMaterial.mutateAsync(deleteTarget.id);
              setSnack('Material eliminado.');
            } else {
              await deleteService.mutateAsync(deleteTarget.id);
              setSnack('Servicio eliminado.');
            }
            setDeleteTarget(null);
          } catch (mutationError) {
            setSnack(toUserErrorMessage(mutationError, 'No se pudo eliminar la linea.'));
          }
        }}
      />

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack(null)} duration={2600}>
        {snack}
      </Snackbar>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 18,
  },
  sectionContent: {
    gap: 16,
    paddingVertical: 10,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE4EC',
  },
  inputOutline: {
    borderRadius: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    borderRadius: 10,
    flexGrow: 1,
    minWidth: 170,
  },
  actionButtonContent: {
    minHeight: 40,
    paddingHorizontal: 8,
  },
  linesList: {
    gap: 14,
  },
  helperText: {
    color: '#5f6368',
    marginTop: 2,
  },
});
