import { AccountOption, DealDraftPayload, ProductOption } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    credentials: "include",
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}

export async function fetchAccounts(search: string): Promise<AccountOption[]> {
  const encoded = encodeURIComponent(search);
  const result = await request<{ records: AccountOption[] }>(`/api/accounts?q=${encoded}`);
  return result.records;
}

export async function fetchProducts(lob: string, currency: string): Promise<ProductOption[]> {
  const query = new URLSearchParams({ lob, currency });
  const result = await request<{ records: ProductOption[] }>(`/api/products?${query.toString()}`);
  return result.records;
}

export async function fetchPicklist(objectApiName: string, fieldApiName: string): Promise<string[]> {
  const result = await request<{ records: Array<{ value: string }> }>(
    `/api/picklists/${encodeURIComponent(objectApiName)}/${encodeURIComponent(fieldApiName)}`
  );

  return result.records.map((record) => record.value);
}

export async function runReferenceSync(): Promise<{ accountsSynced: number; pricebookEntriesSynced: number }> {
  return request<{ accountsSynced: number; pricebookEntriesSynced: number }>("/api/sync/reference-data", {
    method: "POST"
  });
}

export async function createDealDraft(payload: DealDraftPayload): Promise<{ deal: { id: string } }> {
  return request<{ deal: { id: string } }>("/api/deals", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function submitDeal(dealId: string): Promise<unknown> {
  return request(`/api/deals/${dealId}/submit`, {
    method: "POST"
  });
}