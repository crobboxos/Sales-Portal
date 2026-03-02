const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildHeaders(token?: string, contentType = true): HeadersInit {
  const headers: HeadersInit = {};
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `${response.status} ${response.statusText}`;
  try {
    const body = (await response.json()) as { detail?: string };
    if (body.detail) {
      message = body.detail;
    }
  } catch {
    // Ignore JSON parse errors for non-JSON responses
  }
  return new ApiError(message, response.status);
}

export async function apiJson<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(token, init?.body !== undefined),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiPdf(path: string, token?: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: buildHeaders(token, false),
    cache: "no-store",
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return await response.blob();
}
