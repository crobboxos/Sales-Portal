"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiJson, ApiError } from "@/lib/api";
import { ParentMacdAddOptionsResponse, ParentMacdAddRequest, ParentMacdAddResult } from "@/lib/types";

type ParentMacdAddModalProps = {
  isOpen: boolean;
  opportunityId: string | null;
  opportunityName?: string | null;
  accessToken: string | null;
  canWrite: boolean;
  onClose: () => void;
  onCompleted?: (result: ParentMacdAddResult) => void;
};

type ParentMacdAddLineDraft = {
  id: string;
  siteAccountId: string;
  condition: string;
  quantity: string;
  unitPrice: string;
  salesCost: string;
  deliveryDate: string;
  deliverToContactId: string;
  supplierId: string;
};

function createDefaultLine(options: ParentMacdAddOptionsResponse | null): ParentMacdAddLineDraft {
  return {
    id: `${Date.now()}-${Math.random()}`,
    siteAccountId: options?.locations[0]?.id ?? "",
    condition: "New",
    quantity: "1",
    unitPrice: "0",
    salesCost: "0",
    deliveryDate: "",
    deliverToContactId: "",
    supplierId: "",
  };
}

export function ParentMacdAddModal({
  isOpen,
  opportunityId,
  opportunityName,
  accessToken,
  canWrite,
  onClose,
  onCompleted,
}: ParentMacdAddModalProps) {
  const [options, setOptions] = useState<ParentMacdAddOptionsResponse | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [productType, setProductType] = useState("");
  const [productId, setProductId] = useState("");
  const [lines, setLines] = useState<ParentMacdAddLineDraft[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setOptions(null);
    setOptionsError(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    setProductType("");
    setProductId("");
    setLines([]);

    if (!opportunityId || !accessToken) {
      setOptionsError("Missing opportunity or session information.");
      return;
    }

    let cancelled = false;
    const run = async () => {
      setIsLoadingOptions(true);
      try {
        const response = await apiJson<ParentMacdAddOptionsResponse>(
          `/api/opportunities/${opportunityId}/parent-macd-add/options`,
          accessToken,
        );
        if (cancelled) {
          return;
        }
        setOptions(response);
        setProductType(response.productTypes[0] ?? "");
        setProductId(response.products[0]?.id ?? "");
        setLines([createDefaultLine(response)]);
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        const message =
          requestError instanceof ApiError ? requestError.message : "Failed to load Parent MACD Add options.";
        setOptionsError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isOpen, opportunityId]);

  const productLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of options?.products ?? []) {
      map.set(product.id, product.productCode ? `${product.name} (${product.productCode})` : product.name);
    }
    return map;
  }, [options?.products]);

  const openStandardProcess = () => {
    const processUrl = options?.processUrl;
    if (!processUrl) {
      return;
    }
    window.open(processUrl, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) {
    return null;
  }

  const onLineChange = (lineId: string, field: keyof Omit<ParentMacdAddLineDraft, "id">, value: string) => {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)));
  };

  const onAddLine = () => {
    setLines((current) => [...current, createDefaultLine(options)]);
  };

  const onRemoveLine = (lineId: string) => {
    setLines((current) => (current.length <= 1 ? current : current.filter((line) => line.id !== lineId)));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !opportunityId || !canWrite) {
      return;
    }
    if (!productType.trim()) {
      setSubmitError("Product type is required.");
      return;
    }
    if (!productId.trim()) {
      setSubmitError("Product is required.");
      return;
    }
    if (lines.length === 0) {
      setSubmitError("At least one line is required.");
      return;
    }

    const payloadLines: ParentMacdAddRequest["lines"] = [];
    for (const line of lines) {
      const quantity = Number(line.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) {
        setSubmitError("Quantity must be greater than zero on all lines.");
        return;
      }

      const unitPrice = Number(line.unitPrice);
      if (Number.isNaN(unitPrice)) {
        setSubmitError("Unit price must be a valid number on all lines.");
        return;
      }

      const salesCost = Number(line.salesCost);
      if (Number.isNaN(salesCost)) {
        setSubmitError("Sales cost must be a valid number on all lines.");
        return;
      }

      if (!line.condition.trim()) {
        setSubmitError("Condition is required on all lines.");
        return;
      }

      payloadLines.push({
        siteAccountId: line.siteAccountId.trim() || null,
        condition: line.condition.trim(),
        quantity,
        unitPrice,
        salesCost,
        deliveryDate: line.deliveryDate || null,
        deliverToContactId: line.deliverToContactId.trim() || null,
        supplierId: line.supplierId.trim() || null,
      });
    }

    const payload: ParentMacdAddRequest = {
      productType: productType.trim(),
      productId: productId.trim(),
      lines: payloadLines,
    };

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const result = await apiJson<ParentMacdAddResult>(`/api/opportunities/${opportunityId}/parent-macd-add`, accessToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSubmitSuccess(`${result.createdCount} line item(s) created successfully.`);
      onCompleted?.(result);
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : "Failed to run Parent MACD Add process.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 px-4 py-6">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Parent MACD Add</h3>
            <p className="text-xs text-slate-600">{opportunityName ? `Deal: ${opportunityName}` : "Configure line items"}</p>
          </div>
          <div className="flex items-center gap-2">
            {options?.processUrl ? (
              <button
                type="button"
                onClick={openStandardProcess}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900"
              >
                Open Standard Process
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-50 px-5 py-4">
          {isLoadingOptions ? <p className="text-sm text-slate-600">Loading Parent MACD Add options...</p> : null}
          {!isLoadingOptions && optionsError ? <p className="text-sm text-red-700">{optionsError}</p> : null}

          {!isLoadingOptions && !optionsError && options ? (
            <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700">
                Native quick add creates parent opportunity line items.
                {options.processUrl ? " Use Open Standard Process for the full Salesforce flow path." : ""}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-700">
                  Product Type
                  <select
                    value={productType}
                    onChange={(event) => setProductType(event.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {options.productTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-700">
                  Product
                  <select
                    value={productId}
                    onChange={(event) => setProductId(event.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {options.products.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.productCode ? `${item.name} (${item.productCode})` : item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Currency: <span className="font-medium text-slate-800">{options.currencyIsoCode}</span>
                </p>
                <button
                  type="button"
                  onClick={onAddLine}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Add Line
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div key={line.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        Line {index + 1}
                        {productId ? (
                          <span className="ml-2 text-xs font-normal text-slate-500">{productLabelById.get(productId)}</span>
                        ) : null}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemoveLine(line.id)}
                        disabled={lines.length <= 1}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="text-xs text-slate-700">
                        Site
                        <select
                          value={line.siteAccountId}
                          onChange={(event) => onLineChange(line.id, "siteAccountId", event.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="">Select site</option>
                          {options.locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs text-slate-700">
                        Condition
                        <select
                          value={line.condition}
                          onChange={(event) => onLineChange(line.id, "condition", event.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="New">New</option>
                          <option value="Refurbished">Refurbished</option>
                          <option value="Retained">Retained</option>
                        </select>
                      </label>

                      <label className="text-xs text-slate-700">
                        Quantity
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.quantity}
                          onChange={(event) => onLineChange(line.id, "quantity", event.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </label>

                      <label className="text-xs text-slate-700">
                        Delivery Date
                        <input
                          type="date"
                          value={line.deliveryDate}
                          onChange={(event) => onLineChange(line.id, "deliveryDate", event.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </label>

                      <label className="text-xs text-slate-700">
                        Unit Price
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(event) => onLineChange(line.id, "unitPrice", event.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </label>

                      <label className="text-xs text-slate-700">
                        Sales Cost
                        <input
                          type="number"
                          step="0.01"
                          value={line.salesCost}
                          onChange={(event) => onLineChange(line.id, "salesCost", event.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </label>

                      <label className="text-xs text-slate-700">
                        Delivery Contact
                        <select
                          value={line.deliverToContactId}
                          onChange={(event) => onLineChange(line.id, "deliverToContactId", event.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="">Select contact</option>
                          {options.contacts.map((contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs text-slate-700">
                        Supplier Id
                        <input
                          value={line.supplierId}
                          onChange={(event) => onLineChange(line.id, "supplierId", event.target.value)}
                          placeholder="Optional"
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
              {submitSuccess ? <p className="text-sm text-emerald-700">{submitSuccess}</p> : null}
              {!canWrite ? (
                <p className="text-xs text-amber-700">Read-only role: Parent MACD Add requires SalesPortal_Sales or SalesPortal_Admin.</p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !canWrite}
                  className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Line Items (Quick Add)"}
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
