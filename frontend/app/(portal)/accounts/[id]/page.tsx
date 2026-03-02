"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiJson, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Account } from "@/lib/types";


export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
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
        const response = await apiJson<Account>(`/api/accounts/${params.id}`, accessToken);
        setAccount(response);
      } catch (requestError) {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to load account.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [accessToken, params.id]);

  return (
    <section className="space-y-4">
      <Link href="/accounts" className="text-sm font-medium text-brand-700 hover:underline">
        Back to Accounts
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? <p className="text-sm text-slate-600">Loading account...</p> : null}
        {!isLoading && error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && account ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{account.name}</h2>
              <p className="mt-1 text-sm text-slate-600">Account ID: {account.id}</p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-500">Owner</dt>
                <dd className="text-sm text-slate-800">{account.owner}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Phone</dt>
                <dd className="text-sm text-slate-800">{account.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Industry</dt>
                <dd className="text-sm text-slate-800">{account.industry || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Website</dt>
                <dd className="text-sm text-slate-800">{account.website || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Billing City</dt>
                <dd className="text-sm text-slate-800">{account.billingCity || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Billing Country</dt>
                <dd className="text-sm text-slate-800">{account.billingCountry || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Last Modified</dt>
                <dd className="text-sm text-slate-800">{formatDate(account.lastModified)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}
