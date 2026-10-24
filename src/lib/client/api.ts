// Brauzerdan API ga so'rov. Xato bo'lsa, server qaytargan xato kodi (messages "Errors" kaliti) qaytadi.
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

export async function postJson<T = unknown>(
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
