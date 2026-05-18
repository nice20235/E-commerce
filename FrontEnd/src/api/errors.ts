import type { AxiosError } from 'axios'

interface FastAPIValidationError {
  msg: string
  loc?: (string | number)[]
  type?: string
}

interface FastAPIErrorResponse {
  detail?: string | FastAPIValidationError[]
}

/**
 * Extracts a human-readable message from a FastAPI error response.
 * FastAPI returns either { detail: "string" } or { detail: [{msg, loc},...] }.
 */
export function extractApiError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<FastAPIErrorResponse>
  const detail = axiosErr.response?.data?.detail
  if (!detail) return fallback
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(', ')
  }
  return detail
}
