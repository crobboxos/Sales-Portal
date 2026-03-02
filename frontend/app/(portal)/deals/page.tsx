"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Pagination } from "@/components/pagination";
import { apiJson, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { Opportunity, OpportunityCreateRequest, PageResponse } from "@/lib/types";


const PAGE_SIZE = 10;
const WRITE_GROUPS = ["SalesPortal_Admin", "SalesPortal_Sales"];

function getDefaultCloseDate(): string {
  const now = new Date();
  now.setDate(now.getDate() + 30);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DealsPage() {
  const router = useRouter();
  const { accessToken, hasAnyGroup } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [stageInput, setStageInput] = useState("");
  const [ownerInput, setOwnerInput] = useState("");
  const [query, setQuery] = useState({ search: "", stage: "", owner: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResponse<Opportunity>>({ items: [], page: 1, pageSize: PAGE_SIZE, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDealName, setNewDealName] = useState("");
  const [newDealStageName, setNewDealStageName] = useState("Qualification");
  const [newDealCloseDate, setNewDealCloseDate] = useState(getDefaultCloseDate());
  const [newDealAmount, setNewDealAmount] = useState("");
  const [newDealNextStep, setNewDealNextStep] = useState("");
  const [newDealDescription, setNewDealDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canWrite = hasAnyGroup(WRITE_GROUPS);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search: query.search,
          stage: query.stage,
          owner: query.owner,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        const response = await apiJson<PageResponse<Opportunity>>(`/api/opportunities?${params.toString()}`, accessToken);
        setData(response);
      } catch (requestError) {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to load opportunities.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [accessToken, query, page, refreshKey]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery({
      search: searchInput.trim(),
      stage: stageInput.trim(),
      owner: ownerInput.trim(),
    });
  };

  const openCreateModal = () => {
    if (!canWrite) {
      return;
    }
    setNewDealName("");
    setNewDealStageName("Qualification");
    setNewDealCloseDate(getDefaultCloseDate());
    setNewDealAmount("");
    setNewDealNextStep("");
    setNewDealDescription("");
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) {
      return;
    }
    setIsCreateModalOpen(false);
  };

  const onCreateDealSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !canWrite) {
      return;
    }

    const trimmedName = newDealName.trim();
    const trimmedStageName = newDealStageName.trim();
    if (!trimmedName) {
      setCreateError("Deal name is required.");
      return;
    }
    if (!trimmedStageName) {
      setCreateError("Stage is required.");
      return;
    }
    if (!newDealCloseDate.trim()) {
      setCreateError("Close date is required.");
      return;
    }

    const payload: OpportunityCreateRequest = {
      Name: trimmedName,
      StageName: trimmedStageName,
      CloseDate: newDealCloseDate.trim(),
    };

    if (newDealAmount.trim()) {
      const parsedAmount = Number(newDealAmount);
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
        setCreateError("Amount must be a valid number greater than or equal to zero.");
        return;
      }
      payload.Amount = parsedAmount;
    }

    if (newDealNextStep.trim()) {
      payload.NextStep = newDealNextStep.trim();
    }

    if (newDealDescription.trim()) {
      payload.Description = newDealDescription.trim();
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      await apiJson<Opportunity>("/api/opportunities", accessToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setIsCreateModalOpen(false);
      setNewDealName("");
      setNewDealStageName("Qualification");
      setNewDealCloseDate(getDefaultCloseDate());
      setNewDealAmount("");
      setNewDealNextStep("");
      setNewDealDescription("");
      setPage(1);
      setRefreshKey((previous) => previous + 1);
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : "Failed to create deal.";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">Deals (Opportunities)</h2>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={!canWrite}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            New Deal
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-4">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search deals"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            value={stageInput}
            onChange={(event) => setStageInput(event.target.value)}
            placeholder="Stage (placeholder)"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            value={ownerInput}
            onChange={(event) => setOwnerInput(event.target.value)}
            placeholder="Owner (placeholder)"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900">
            Apply Filters
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Close Date</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Last Modified</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading opportunities...
                  </td>
                </tr>
              ) : null}
              {!isLoading && error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-700">
                    {error}
                  </td>
                </tr>
              ) : null}
              {!isLoading && !error && data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No opportunities found.
                  </td>
                </tr>
              ) : null}
              {!isLoading && !error
                ? data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-t border-slate-100 transition hover:bg-brand-50/70"
                      onClick={() => router.push(`/deals/${item.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3">{item.account || "-"}</td>
                      <td className="px-4 py-3">{item.stageName}</td>
                      <td className="px-4 py-3">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-3">{formatDate(item.closeDate)}</td>
                      <td className="px-4 py-3">{item.owner}</td>
                      <td className="px-4 py-3">{formatDate(item.lastModified)}</td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">New Deal</h3>
            <p className="mt-1 text-sm text-slate-600">Enter the basic details to create an opportunity in Salesforce.</p>

            <form onSubmit={(event) => void onCreateDealSubmit(event)} className="mt-4 grid gap-3">
              <label className="text-sm text-slate-700">
                Deal Name
                <input
                  value={newDealName}
                  onChange={(event) => setNewDealName(event.target.value)}
                  required
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Stage
                <input
                  value={newDealStageName}
                  onChange={(event) => setNewDealStageName(event.target.value)}
                  required
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Close Date
                <input
                  type="date"
                  value={newDealCloseDate}
                  onChange={(event) => setNewDealCloseDate(event.target.value)}
                  required
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDealAmount}
                  onChange={(event) => setNewDealAmount(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Next Step
                <input
                  value={newDealNextStep}
                  onChange={(event) => setNewDealNextStep(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Description
                <textarea
                  value={newDealDescription}
                  onChange={(event) => setNewDealDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              {createError ? <p className="text-sm text-red-700">{createError}</p> : null}
              {!canWrite ? <p className="text-xs text-amber-700">Read-only role: creating deals requires SalesPortal_Sales or SalesPortal_Admin.</p> : null}
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !canWrite}
                  className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating ? "Saving..." : "Save Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
