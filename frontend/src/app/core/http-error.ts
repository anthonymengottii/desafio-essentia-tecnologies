import { HttpErrorResponse } from '@angular/common/http';

/** Erros de validação por campo, vindos do Zod no backend. */
export type FieldErrors = Record<string, string[]>;

export interface ApiError {
  message: string;
  fieldErrors: FieldErrors;
}

/** Normaliza a resposta de erro da API em mensagem geral + erros por campo. */
export function parseApiError(err: unknown, fallback = 'Ocorreu um erro'): ApiError {
  if (err instanceof HttpErrorResponse) {
    const body = err.error ?? {};
    return {
      message: body.error ?? fallback,
      fieldErrors: (body.details as FieldErrors) ?? {},
    };
  }
  return { message: fallback, fieldErrors: {} };
}
