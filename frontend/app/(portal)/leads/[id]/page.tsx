"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiJson, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Lead } from "@/lib/types";


export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !params.id) {
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiJson<Lead>(`/api/leads/${params.id}`, accessToken);
        setLead(response);
      } catch (requestError) {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to load lead.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [accessToken, params.id]);

  return (
    <section className="space-y-4">
      <Link href="/leads" className="text-sm font-medium text-brand-700 hover:underline">
        Back to Leads
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? <p className="text-sm text-slate-600">Loading lead...</p> : null}
        {!isLoading && error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && lead ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{lead.name}</h2>
              <p className="mt-1 text-sm text-slate-600">Lead ID: {lead.id}</p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-500">Company</dt>
                <dd className="text-sm text-slate-800">{lead.company || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Status</dt>
                <dd className="text-sm text-slate-800">{lead.status || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Rating</dt>
                <dd className="text-sm text-slate-800">{lead.rating || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Owner</dt>
                <dd className="text-sm text-slate-800">{lead.owner || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Email</dt>
                <dd className="text-sm text-slate-800">{lead.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Phone</dt>
                <dd className="text-sm text-slate-800">{lead.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Source</dt>
                <dd className="text-sm text-slate-800">{lead.source || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Created Date</dt>
                <dd className="text-sm text-slate-800">{formatDate(lead.createdDate)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}
