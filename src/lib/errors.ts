/** Message d'erreur lisible depuis une erreur axios / Laravel. */
export function apiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
  return data?.message || Object.values(data?.errors || {})[0]?.[0] || fallback;
}
