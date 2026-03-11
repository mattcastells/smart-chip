import { Text } from 'react-native-paper';

import { AppScreen } from '@/components/AppScreen';
import { WorkCalendarCard } from '@/features/appointments/WorkCalendarCard';

export default function CalendarScreen() {
  return (
    <AppScreen title="Calendario">
      <Text>Selecciona un dia para ver trabajos programados y abrir su detalle.</Text>
      <WorkCalendarCard />
    </AppScreen>
  );
}
