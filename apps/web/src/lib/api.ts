import 'server-only';

// Server-only (see ADR 0006): the only place that reads API_URL.
export async function apiRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error(
      'API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.',
    );
  }
  return fetch(`${apiUrl}${path}`, { ...init, cache: 'no-store' });
}

export async function apiFetch<T>(
  path: string,
  schema: { parse: (data: unknown) => T },
  init?: RequestInit,
): Promise<T> {
  const response = await apiRequest(path, init);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${path}`);
  }
  return schema.parse(await response.json());
}
