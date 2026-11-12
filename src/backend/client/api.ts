// Brauzer tomonidagi kichik fetch yordamchisi. Server xatolari { error, fields } shaklida keladi.

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

export function getJson<T = unknown>(path: string): Promise<ApiResult<T>> {
  return requestJson<T>("GET", path);
}

export function postJson<T = unknown>(
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  return requestJson<T>("POST", path, body);
}

export async function requestJson<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, data: data as T };
    return {
      ok: false,
      error: data.error ?? "SERVER_ERROR",
      fields: data.fields,
    };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}
