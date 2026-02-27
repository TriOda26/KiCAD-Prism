export interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.detail || payload.message || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = "Request failed"
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await readApiError(response, fallbackError));
  }
  return (await response.json()) as T;
}

