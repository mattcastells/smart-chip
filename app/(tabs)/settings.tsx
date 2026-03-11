import { Share, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { Button, Card, Snackbar, Text, TextInput } from 'react-native-paper';

import { AppScreen } from '@/components/AppScreen';
import { useExportBackup, useRestoreBackup } from '@/features/backup/hooks';
import { signOut } from '@/features/auth/service';
import { toUserErrorMessage } from '@/lib/errors';

export default function SettingsScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [backupJson, setBackupJson] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const exportBackup = useExportBackup();
  const restoreBackup = useRestoreBackup();

  const isBusy = isSigningOut || exportBackup.isPending || restoreBackup.isPending;

  const generateBackup = async () => {
    try {
      const payload = await exportBackup.mutateAsync();
      const serialized = JSON.stringify(payload, null, 2);
      setBackupJson(serialized);
      setMessage('Backup generado.');
    } catch (error) {
      setMessage(toUserErrorMessage(error, 'No se pudo generar el backup.'));
    }
  };

  const shareBackup = async () => {
    try {
      if (!backupJson.trim()) {
        throw new Error('Primero genera un backup.');
      }
      await Share.share({
        message: backupJson,
        title: 'Backup Nossa Clima',
      });
    } catch (error) {
      setMessage(toUserErrorMessage(error, 'No se pudo compartir el backup.'));
    }
  };

  const restoreFromBackup = async () => {
    try {
      if (!backupJson.trim()) {
        throw new Error('Pega un JSON de backup valido.');
      }
      const parsed = JSON.parse(backupJson);
      await restoreBackup.mutateAsync(parsed);
      setMessage('Backup restaurado.');
    } catch (error) {
      setMessage(toUserErrorMessage(error, 'No se pudo restaurar el backup.'));
    }
  };

  return (
    <AppScreen title="Opciones">
      <Text>Configuracion general y mantenimiento de datos.</Text>

      <Card mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Backup / Restauracion</Text>
          <Text style={styles.helperText}>Puedes exportar tus datos en JSON o restaurarlos pegando un backup.</Text>
          <View style={styles.actions}>
            <Button mode="contained" onPress={generateBackup} loading={exportBackup.isPending} disabled={isBusy}>
              Generar backup
            </Button>
            <Button mode="outlined" onPress={shareBackup} disabled={isBusy || !backupJson.trim()}>
              Compartir backup
            </Button>
          </View>
          <TextInput
            mode="outlined"
            label="JSON de backup"
            value={backupJson}
            onChangeText={setBackupJson}
            multiline
            numberOfLines={10}
            style={styles.jsonInput}
          />
          <Button mode="contained-tonal" onPress={restoreFromBackup} loading={restoreBackup.isPending} disabled={isBusy || !backupJson.trim()}>
            Restaurar backup
          </Button>
        </Card.Content>
      </Card>

      <Card mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">Sesion</Text>
          <Button
            mode="outlined"
            loading={isSigningOut}
            disabled={isSigningOut}
            onPress={async () => {
              try {
                setIsSigningOut(true);
                await signOut();
              } catch (error) {
                setMessage(toUserErrorMessage(error, 'No se pudo cerrar sesion.'));
              } finally {
                setIsSigningOut(false);
              }
            }}
          >
            Cerrar sesion
          </Button>
        </Card.Content>
      </Card>

      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage(null)}>
        {message}
      </Snackbar>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    gap: 12,
  },
  helperText: {
    color: '#5f6368',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  jsonInput: {
    maxHeight: 260,
  },
});
