import { Link } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { AppScreen } from '@/components/AppScreen';
import { LoadingOrError } from '@/components/LoadingOrError';
import { useQuotes } from '@/features/quotes/hooks';
import { formatCurrencyArs, formatDateAr } from '@/lib/format';

export default function QuotesScreen() {
  const { data, isLoading, error } = useQuotes();

  return (
    <AppScreen title="Trabajos">
      <View style={styles.topActions}>
        <Link href="/quotes/new" asChild>
          <Button mode="contained">Nuevo trabajo</Button>
        </Link>
        <Link href="/quotes/cleanup" asChild>
          <Button mode="outlined" icon="delete-sweep-outline">
            Limpiar antiguos
          </Button>
        </Link>
      </View>

      <LoadingOrError isLoading={isLoading} error={error} />

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Link href={`/quotes/${item.id}`} asChild>
            <Card mode="outlined" style={styles.quoteCard}>
              <View style={styles.headerBlock}>
                <Text style={styles.headerTitle}>{item.title}</Text>
              </View>
              <Card.Content style={styles.quoteContent}>
                <Text style={styles.clientName}>{item.client_name}</Text>
                <Text>{formatCurrencyArs(item.total)}</Text>
                <Text>{formatDateAr(item.created_at)}</Text>
              </Card.Content>
            </Card>
          </Link>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text>No hay trabajos cargados. Crea uno nuevo para comenzar.</Text>
          </View>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  quoteCard: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerBlock: {
    backgroundColor: '#F6F8FB',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  quoteContent: {
    paddingTop: 12,
    gap: 6,
  },
  clientName: {
    color: '#5f6368',
  },
  emptyState: {
    paddingVertical: 8,
  },
});
