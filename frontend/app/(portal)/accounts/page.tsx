"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Pagination } from "@/components/pagination";
import { apiJson, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Account, PageResponse } from "@/lib/types";


const PAGE_SIZE = 10;

export default function AccountsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResponse<Account>>({ items: [], page: 1, pageSize: PAGE_SIZE, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        const response = await apiJson<PageResponse<Account>>(`/api/accounts?${params.toString()}`, accessToken);
        setData(response);
      } catch (requestError) {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to load accounts.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [accessToken, search, page]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <section>
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-semibold text-slate-900">Accounts</h2>
        <form onSubmit={onSubmit} className="flex w-full max-w-md gap-2">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search accounts"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Last Modified</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : null}
              {!isLoading && error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-700">
                    {error}
                  </td>
                </tr>
              ) : null}
              {!isLoading && !error && data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No accounts found.
                  </td>
                </tr>
              ) : null}
              {!isLoading && !error
                ? data.items.map((account) => (
                    <tr
                      key={account.id}
                      className="cursor-pointer border-t border-slate-100 transition hover:bg-brand-50/70"
                      onClick={() => router.push(`/accounts/${account.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{account.name}</td>
                      <td className="px-4 py-3">{account.owner}</td>
                      <td className="px-4 py-3">{account.phone || "-"}</td>
                      <td className="px-4 py-3">{account.industry || "-"}</td>
                      <td className="px-4 py-3">{formatDate(account.lastModified)}</td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
    </section>
  );
}
