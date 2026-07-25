import { ApiError } from '@/lib/api';

type ZodFlatten = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

export function fieldErrorsFromApi(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || !err.details || typeof err.details !== 'object') {
    return {};
  }

  const details = err.details as ZodFlatten;
  const out: Record<string, string> = {};
  if (!details.fieldErrors) return out;

  for (const [key, messages] of Object.entries(details.fieldErrors)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}

export function firstApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const fields = fieldErrorsFromApi(err);
    const firstField = Object.values(fields)[0];
    if (firstField) return firstField;
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
