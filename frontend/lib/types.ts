export interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Account {
  id: string;
  name: string;
  owner: string;
  phone?: string | null;
  industry?: string | null;
  website?: string | null;
  billingCity?: string | null;
  billingCountry?: string | null;
  lastModified: string;
}

export interface Opportunity {
  id: string;
  name: string;
  account?: string | null;
  stageName: string;
  amount?: number | null;
  closeDate?: string | null;
  owner: string;
  lastModified: string;
  nextStep?: string | null;
  description?: string | null;
}

export interface OpportunityPatchRequest {
  StageName?: string;
  CloseDate?: string;
  Amount?: number;
  NextStep?: string;
}

export interface QuoteLineItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  name: string;
  account?: string | null;
  opportunity?: string | null;
  status: string;
  grandTotal?: number | null;
  expirationDate?: string | null;
  owner?: string | null;
  lineItems?: QuoteLineItem[];
  lastModified: string;
}

export interface QuoteGenerateResponse {
  url: string;
}

export interface Lead {
  id: string;
  name: string;
  company?: string | null;
  status?: string | null;
  rating?: string | null;
  owner?: string | null;
  createdDate: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
}

export interface AuthUser {
  name?: string;
  email?: string;
  groups: string[];
}
