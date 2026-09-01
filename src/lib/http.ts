export type FetchJsonOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  json?: unknown;
};

export async function fetchJson<T>(url: string, options?: FetchJsonOptions): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {})
  };

  let body = options?.body;

  if (options?.json !== undefined) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    body = JSON.stringify(options.json);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body
  });

  if (!response.ok) {
    let message = "Falha na requisicao";
    try {
      const respBody = (await response.json()) as { message?: string };
      if (respBody.message) {
        message = respBody.message;
      }
    } catch {
      // noop
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
