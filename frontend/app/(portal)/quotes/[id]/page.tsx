"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiJson, apiPdf, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { Quote, QuoteGenerateResponse, QuoteLineItem } from "@/lib/types";


const WRITE_GROUPS = ["SalesPortal_Admin", "SalesPortal_Sales"];

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken, hasAnyGroup } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const canWrite = useMemo(() => hasAnyGroup(WRITE_GROUPS), [hasAnyGroup]);

  useEffect(() => {
    if (!accessToken || !params.id) {
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiJson<Quote>(`/api/quotes/${params.id}`, accessToken);
        setQuote(response);
      } catch (requestError) {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to load quote.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [accessToken, params.id]);

  const generatePdf = async () => {
    if (!accessToken || !params.id || !canWrite) {
      return;
    }
    setIsGenerating(true);
    setStatusMessage(null);
    setError(null);
    try {
      const response = await apiJson<QuoteGenerateResponse>(`/api/quotes/${params.id}/generate`, accessToken, {
        method: "POST",
      });
      setGeneratedUrl(response.url);
      setStatusMessage("Composer URL generated.");
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : "Failed to generate PDF URL.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLatest = async () => {
    if (!accessToken || !params.id) {
      return;
    }
    setIsDownloading(true);
    setStatusMessage(null);
    setError(null);
    try {
      const blob = await apiPdf(`/api/quotes/${params.id}/document`, accessToken);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${quote?.quoteNumber || params.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setStatusMessage("PDF download started.");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 404) {
        setError("No PDF document found for this quote yet.");
      } else {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to download PDF.";
        setError(message);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="space-y-4">
      <Link href="/quotes" className="text-sm font-medium text-brand-700 hover:underline">
        Back to Quotes
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? <p className="text-sm text-slate-600">Loading quote...</p> : null}
        {!isLoading && error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && quote ? (
          <>
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{quote.name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {quote.quoteNumber} | Quote ID: {quote.id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void generatePdf()}
                  disabled={!canWrite || isGenerating}
                  className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => void downloadLatest()}
                  disabled={isDownloading}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDownloading ? "Downloading..." : "Download Latest PDF"}
                </button>
              </div>
            </div>

            {!canWrite ? <p className="mb-4 text-xs text-amber-700">Generate PDF requires SalesPortal_Sales or SalesPortal_Admin.</p> : null}
            {statusMessage ? <p className="mb-4 text-sm text-emerald-700">{statusMessage}</p> : null}
            {generatedUrl ? (
              <p className="mb-4 break-all text-xs text-slate-600">
                Composer URL: <a href={generatedUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">{generatedUrl}</a>
              </p>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-500">Account</dt>
                <dd className="text-sm text-slate-800">{quote.account || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Opportunity</dt>
                <dd className="text-sm text-slate-800">{quote.opportunity || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Status</dt>
                <dd className="text-sm text-slate-800">{quote.status}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Grand Total</dt>
                <dd className="text-sm text-slate-800">{formatCurrency(quote.grandTotal)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Expiration Date</dt>
                <dd className="text-sm text-slate-800">{formatDate(quote.expirationDate)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Last Modified</dt>
                <dd className="text-sm text-slate-800">{formatDate(quote.lastModified)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
              {quote.lineItems && quote.lineItems.length > 0 ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Quantity</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(quote.lineItems as QuoteLineItem[]).map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No line items available.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
