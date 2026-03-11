export interface SupabaseErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

const APPOINTMENT_QUOTE_LINK_ERROR_CODES = new Set(['42703', '42P01', 'PGRST204', 'PGRST205']);

const includesMissingSchemaPatterns = (text: string): boolean => {
  const hasAppointmentsRef = text.includes('appointments') || text.includes('public.appointments');
  const hasMissingRef =
    text.includes('schema cache') ||
    text.includes('could not find') ||
    text.includes('not found') ||
    text.includes('undefined column') ||
    text.includes('undefined table');

  return hasAppointmentsRef && hasMissingRef;
};

export const isMissingAppointmentQuoteLinkError = (error: SupabaseErrorLike | null | undefined): boolean => {
  if (!error) return false;

  if (error.code && APPOINTMENT_QUOTE_LINK_ERROR_CODES.has(error.code)) {
    return true;
  }

  const text = [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();

  if (!text) return false;
  if (text.includes('quote_id')) return true;

  return includesMissingSchemaPatterns(text);
};
