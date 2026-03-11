import { describe, expect, it } from 'vitest';

import { isMissingAppointmentQuoteLinkError } from '../supabaseCompatibility';

describe('isMissingAppointmentQuoteLinkError', () => {
  it('detecta codigos SQL/PostgREST conocidos', () => {
    expect(isMissingAppointmentQuoteLinkError({ code: '42703' })).toBe(true);
    expect(isMissingAppointmentQuoteLinkError({ code: 'PGRST205' })).toBe(true);
  });

  it('detecta errores textuales vinculados a quote_id', () => {
    expect(
      isMissingAppointmentQuoteLinkError({
        message: "Could not find the 'quote_id' column of 'appointments' in the schema cache",
      }),
    ).toBe(true);
  });

  it('detecta mensajes de tabla appointments faltante en cache', () => {
    expect(
      isMissingAppointmentQuoteLinkError({
        message: "Could not find the table 'public.appointments' in the schema cache",
      }),
    ).toBe(true);
  });

  it('no marca errores no relacionados', () => {
    expect(
      isMissingAppointmentQuoteLinkError({
        code: '42501',
        message: 'new row violates row-level security policy',
      }),
    ).toBe(false);
  });
});
