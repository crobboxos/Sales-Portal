"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { ParentMacdAddModal } from "@/components/parent-macd-add-modal";
import { apiJson, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { Opportunity, OpportunityPatchRequest } from "@/lib/types";


const WRITE_GROUPS = ["SalesPortal_Admin", "SalesPortal_Sales"];

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken, hasAnyGroup } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [stageName, setStageName] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMacdModalOpen, setIsMacdModalOpen] = useState(false);

  const canWrite = useMemo(() => hasAnyGroup(WRITE_GROUPS), [hasAnyGroup]);

  const openStandardParentMacdProcess = () => {
    if (!opportunity?.parentMacdAddUrl) {
      return;
    }
    window.open(opportunity.parentMacdAddUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!accessToken || !params.id) {
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiJson<Opportunity>(`/api/opportunities/${params.id}`, accessToken);
        setOpportunity(response);
        setStageName(response.stageName);
        setCloseDate(response.closeDate ? response.closeDate.slice(0, 10) : "");
        setAmount(response.amount !== undefined && response.amount !== null ? String(response.amount) : "");
        setNextStep(response.nextStep || "");
      } catch (requestError) {
        const message = requestError instanceof ApiError ? requestError.message : "Failed to load deal.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [accessToken, params.id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !params.id || !canWrite) {
      return;
    }

    const payload: OpportunityPatchRequest = {};
    if (stageName.trim()) {
      payload.StageName = stageName.trim();
    }
    if (closeDate.trim()) {
      payload.CloseDate = closeDate.trim();
    }
    if (amount.trim()) {
      payload.Amount = Number(amount);
    }
    if (nextStep.trim()) {
      payload.NextStep = nextStep.trim();
    }

    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      const updated = await apiJson<Opportunity>(`/api/opportunities/${params.id}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setOpportunity(updated);
      setStageName(updated.stageName);
      setCloseDate(updated.closeDate ? updated.closeDate.slice(0, 10) : "");
      setAmount(updated.amount !== undefined && updated.amount !== null ? String(updated.amount) : "");
      setNextStep(updated.nextStep || "");
      setStatusMessage("Opportunity updated.");
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : "Failed to update opportunity.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <Link href="/deals" className="text-sm font-medium text-brand-700 hover:underline">
        Back to Deals
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? <p className="text-sm text-slate-600">Loading deal...</p> : null}
        {!isLoading && error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && opportunity ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">{opportunity.name}</h2>
              <p className="mt-1 text-sm text-slate-600">Opportunity ID: {opportunity.id}</p>
              {canWrite ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {opportunity.parentMacdAddUrl ? (
                    <button
                      type="button"
                      onClick={openStandardParentMacdProcess}
                      className="inline-flex rounded-md bg-brand-700 px-4 py-2 text-xs font-medium text-white hover:bg-brand-900"
                    >
                      Open Parent MACD Add Process
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsMacdModalOpen(true)}
                    className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Native Quick Add
                  </button>
                </div>
              ) : null}
            </div>

            <dl className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-500">Account</dt>
                <dd className="text-sm text-slate-800">{opportunity.account || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Owner</dt>
                <dd className="text-sm text-slate-800">{opportunity.owner}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Current Amount</dt>
                <dd className="text-sm text-slate-800">{formatCurrency(opportunity.amount)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Last Modified</dt>
                <dd className="text-sm text-slate-800">{formatDate(opportunity.lastModified)}</dd>
              </div>
            </dl>

            <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Update Deal</h3>
              <label className="text-sm text-slate-700">
                Stage
                <input
                  value={stageName}
                  onChange={(event) => setStageName(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Close Date
                <input
                  type="date"
                  value={closeDate}
                  onChange={(event) => setCloseDate(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="text-sm text-slate-700">
                Next Step
                <input
                  value={nextStep}
                  onChange={(event) => setNextStep(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              {!canWrite ? <p className="text-xs text-amber-700">Read-only role: updates require SalesPortal_Sales or SalesPortal_Admin.</p> : null}
              {statusMessage ? <p className="text-sm text-emerald-700">{statusMessage}</p> : null}
              <button
                type="submit"
                disabled={!canWrite || isSaving}
                className="w-fit rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </>
        ) : null}
      </div>

      <ParentMacdAddModal
        isOpen={isMacdModalOpen}
        opportunityId={opportunity?.id ?? null}
        opportunityName={opportunity?.name}
        accessToken={accessToken}
        canWrite={canWrite}
        onClose={() => setIsMacdModalOpen(false)}
      />
    </section>
  );
}
