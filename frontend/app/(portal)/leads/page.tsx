"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Pagination } from "@/components/pagination";
import { apiJson, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Lead, PageResponse } from "@/lib/types";


const PAGE_SIZE = 10;

export default function LeadsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResponse<Lead>>({ items: [], page: 1, pageSize: PAGE_SIZE, total: 0 });
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
          status: statusFilter,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        const response = await apiJson<PageResponse<Lead>>(`/api/leads?${params.toString()}`, accessToken);
        setData(response);
      } catch (requestError) {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to load leads.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [accessToken, page, search, statusFilter]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setStatusFilter(statusInput.trim());
  };

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Leads</h2>
        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-3">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search leads"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            placeholder="Status"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
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
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Created Date</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading leads...
                  </td>
                </tr>
              ) : null}
              {!isLoading && error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-700">
                    {error}
                  </td>
                </tr>
              ) : null}
              {!isLoading && !error && data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No leads found.
                  </td>
                </tr>
              ) : null}
              {!isLoading && !error
                ? data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-t border-slate-100 transition hover:bg-brand-50/70"
                      onClick={() => router.push(`/leads/${item.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3">{item.company || "-"}</td>
                      <td className="px-4 py-3">{item.status || "-"}</td>
                      <td className="px-4 py-3">{item.rating || "-"}</td>
                      <td className="px-4 py-3">{item.owner || "-"}</td>
                      <td className="px-4 py-3">{formatDate(item.createdDate)}</td>
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
