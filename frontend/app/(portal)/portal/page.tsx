"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDealDraft,
  fetchAccounts,
  fetchPicklist,
  fetchProducts,
  runReferenceSync,
  submitDeal
} from "@/lib/api";
import { DealDraftPayload, DealLineDraft, ProductOption, ValidationError } from "@/lib/types";
import { validateDraft } from "@/lib/validation";

function createEmptyLine(): DealLineDraft {
  return {
    product2Id: "",
    pricebookEntryId: "",
    quantity: 1,
    unitPrice: 0,
    productCondition: "New",
    salesCost: 0,
    contractTypeSoftware: "",
    subscriptionStartDate: "",
    subscriptionTermMonths: 12,
    subscriptionBillingCommitment: "",
    subscriptionBillingPlan: ""
  };
}

type SubmitStatus =
  | { type: "idle" }
  | { type: "running" }
  | { type: "success"; message: string; sfOppId?: string }
  | { type: "error"; message: string };

function toNumberDisplay(value: number | undefined): string {
  return Number(value ?? 0).toFixed(2);
}

export default function PortalPage() {
  const [accountSearch, setAccountSearch] = useState("");
  const [accounts, setAccounts] = useState<Array<{ sfAccountId: string; name: string; accountNumber?: string }>>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [stages, setStages] = useState<string[]>(["Open"]);
  const [fundingTypes, setFundingTypes] = useState<string[]>(["Subscription"]);
  const [currencies, setCurrencies] = useState<string[]>(["GBP"]);
  const [productConditions, setProductConditions] = useState<string[]>(["New", "Refurbished", "Retained"]);
  const [contractTypes, setContractTypes] = useState<string[]>(["Standard"]);
  const [billingCommitments, setBillingCommitments] = useState<string[]>([]);
  const [billingPlans, setBillingPlans] = useState<string[]>([]);
  const [status, setStatus] = useState<SubmitStatus>({ type: "idle" });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [serverErrors, setServerErrors] = useState<Array<{ portalField: string; message: string; severity: string }>>([]);

  const [payload, setPayload] = useState<DealDraftPayload>({
    accountId: "",
    stageName: "Open",
    closeDate: new Date().toISOString().slice(0, 10),
    linesOfBusiness: "Software Licensing",
    fundingType: "Subscription",
    currencyIsoCode: "GBP",
    lines: [createEmptyLine()]
  });

  const blockingValidationErrors = useMemo(
    () => validationErrors.filter((entry) => entry.severity === "block"),
    [validationErrors]
  );
  const warningValidationErrors = useMemo(
    () => validationErrors.filter((entry) => entry.severity === "warn"),
    [validationErrors]
  );
  const selectedFundingOptions = useMemo(() => {
    if (fundingTypes.length > 0) {
      return fundingTypes;
    }
    return ["Subscription"];
  }, [fundingTypes]);

  useEffect(() => {
    const loadInitialState = async (): Promise<void> => {
      try {
        await runReferenceSync();
      } catch {
        // If sync fails, existing cache may still be present.
      }

      try {
        const [stageValues, fundingValues, currencyValues, conditionValues, contractValues, commitmentValues, planValues] =
          await Promise.all([
            fetchPicklist("Opportunity", "StageName"),
            fetchPicklist("Opportunity", "Funding_Type__c"),
            fetchPicklist("Opportunity", "CurrencyIsoCode"),
            fetchPicklist("OpportunityLineItem", "Product_Condition__c"),
            fetchPicklist("OpportunityLineItem", "Contract_Type_Software__c"),
            fetchPicklist("OpportunityLineItem", "Subscription_Billing_Commitment__c"),
            fetchPicklist("OpportunityLineItem", "Subscription_Billing_Plan__c")
          ]);

        if (stageValues.length > 0) {
          setStages(stageValues);
        }
        if (fundingValues.length > 0) {
          setFundingTypes(fundingValues);
        }
        if (currencyValues.length > 0) {
          setCurrencies(currencyValues);
        }
        if (conditionValues.length > 0) {
          setProductConditions(conditionValues);
        }
        if (contractValues.length > 0) {
          setContractTypes(contractValues);
        }
        if (commitmentValues.length > 0) {
          setBillingCommitments(commitmentValues);
        }
        if (planValues.length > 0) {
          setBillingPlans(planValues);
        }
      } catch {
        // Continue with static defaults.
      }

      try {
        const accountRecords = await fetchAccounts("");
        setAccounts(accountRecords);
      } catch {
        // Leave account list empty.
      }
    };

    void loadInitialState();
  }, []);

  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      try {
        const records = await fetchProducts(payload.linesOfBusiness, payload.currencyIsoCode);
        setProducts(records);
      } catch {
        setProducts([]);
      }
    };

    void loadProducts();
  }, [payload.linesOfBusiness, payload.currencyIsoCode]);

  const onSearchAccounts = async (): Promise<void> => {
    try {
      const records = await fetchAccounts(accountSearch);
      setAccounts(records);
    } catch {
      setAccounts([]);
    }
  };

  const updateLine = (index: number, updater: (line: DealLineDraft) => DealLineDraft): void => {
    setPayload((current) => {
      const nextLines = [...current.lines];
      nextLines[index] = updater(nextLines[index]);
      return {
        ...current,
        lines: nextLines
      };
    });
  };

  const onProductSelected = (index: number, pricebookEntryId: string): void => {
    const selected = products.find((product) => product.sfPricebookEntryId === pricebookEntryId);
    if (!selected) {
      return;
    }

    updateLine(index, (line) => ({
      ...line,
      product2Id: selected.sfProduct2Id,
      pricebookEntryId: selected.sfPricebookEntryId,
      unitPrice: Number(selected.unitPrice)
    }));
  };

  const onAddLine = (): void => {
    setPayload((current) => ({
      ...current,
      lines: [...current.lines, createEmptyLine()]
    }));
  };

  const onRemoveLine = (index: number): void => {
    setPayload((current) => ({
      ...current,
      lines: current.lines.filter((_, lineIndex) => lineIndex !== index)
    }));
  };

  const onSubmit = async (): Promise<void> => {
    setServerErrors([]);
    const localErrors = validateDraft(payload);
    setValidationErrors(localErrors);

    if (localErrors.some((entry) => entry.severity === "block")) {
      setStatus({ type: "error", message: "Fix blocking validation errors before submit." });
      return;
    }

    setStatus({ type: "running" });

    try {
      const created = await createDealDraft(payload);
      const submissionResult = (await submitDeal(created.deal.id)) as {
        success?: boolean;
        sfOppId?: string;
        status?: string;
      };

      setStatus({
        type: "success",
        message: `Submission complete with status: ${submissionResult.status ?? "unknown"}`,
        sfOppId: submissionResult.sfOppId
      });
    } catch (error) {
      const details = error as {
        message?: string;
        errors?: Array<{ portalField: string; message: string; severity: string }>;
      };

      setServerErrors(details.errors ?? []);
      setStatus({
        type: "error",
        message: details.message ?? "Submission failed. Check Salesforce field errors and try again."
      });
    }
  };

  return (
    <main className="app-shell">
      <div className="app-container">
        <section className="panel dashboard-head">
          <div>
            <h1 className="dashboard-title">Software Licensing Dashboard</h1>
            <p className="dashboard-copy">
              Creates Salesforce opportunities and line items using Composite API idempotent upsert with portal-owned
              delivery lines.
            </p>
          </div>
          <div className="topbar-meta">
            <span className="status-badge status-cyan">Composite API</span>
            <span className="status-badge status-purple">{payload.currencyIsoCode}</span>
          </div>
        </section>

        <div className="tabs">
          <button type="button" className="tab active">
            Opportunity Builder
          </button>
          <button type="button" className="tab" disabled>
            Reference Monitor
          </button>
          <button type="button" className="tab" disabled>
            Submission Log
          </button>
        </div>

        <section className="dashboard-metrics">
          <article className="metric-card">
            <span className="metric-label">Accounts Loaded</span>
            <span className="metric-value">{accounts.length.toString().padStart(2, "0")}</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Products Available</span>
            <span className="metric-value">{products.length.toString().padStart(2, "0")}</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Draft Lines</span>
            <span className="metric-value">{payload.lines.length.toString().padStart(2, "0")}</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Close Date</span>
            <span className="metric-value">{payload.closeDate}</span>
          </article>
        </section>

        <section className="panel">
          <div className="panel-body">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Opportunity Header</h2>
                <p className="panel-subtitle">Search accounts and set header fields before building line items.</p>
              </div>
              <span className="status-badge status-neutral">Stage {payload.stageName}</span>
            </div>

            <div className="actions">
              <label className="field search-field">
                <span className="field-label">Account Search</span>
                <input
                  value={accountSearch}
                  onChange={(event) => setAccountSearch(event.target.value)}
                  placeholder="Search by account name or number"
                />
              </label>
              <button type="button" className="btn" onClick={onSearchAccounts}>
                Search Accounts
              </button>
            </div>

            <div className="form-grid cols-3">
              <label className="field">
                <span className="field-label">Account</span>
                <select
                  value={payload.accountId}
                  onChange={(event) => setPayload((current) => ({ ...current, accountId: event.target.value }))}
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.sfAccountId} value={account.sfAccountId}>
                      {account.name}
                      {account.accountNumber ? ` (${account.accountNumber})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Stage</span>
                <select
                  value={payload.stageName}
                  onChange={(event) => setPayload((current) => ({ ...current, stageName: event.target.value }))}
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Close Date</span>
                <input
                  type="date"
                  value={payload.closeDate}
                  onChange={(event) => setPayload((current) => ({ ...current, closeDate: event.target.value }))}
                />
              </label>

              <label className="field">
                <span className="field-label">Line of Business</span>
                <input value={payload.linesOfBusiness} readOnly />
              </label>

              <label className="field">
                <span className="field-label">Funding Type</span>
                {selectedFundingOptions.length <= 4 ? (
                  <div className="segmented" role="tablist" aria-label="Funding Type">
                    {selectedFundingOptions.map((fundingType) => (
                      <button
                        type="button"
                        key={fundingType}
                        className={payload.fundingType === fundingType ? "active" : ""}
                        onClick={() => setPayload((current) => ({ ...current, fundingType }))}
                      >
                        {fundingType}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    value={payload.fundingType}
                    onChange={(event) => setPayload((current) => ({ ...current, fundingType: event.target.value }))}
                  >
                    {selectedFundingOptions.map((fundingType) => (
                      <option key={fundingType} value={fundingType}>
                        {fundingType}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="field">
                <span className="field-label">Currency</span>
                <select
                  value={payload.currencyIsoCode}
                  onChange={(event) => setPayload((current) => ({ ...current, currencyIsoCode: event.target.value }))}
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-body">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Line Items</h2>
                <p className="panel-subtitle">Configure products, pricing, and subscription terms per line.</p>
              </div>
              <button type="button" className="btn" onClick={onAddLine}>
                Add Line
              </button>
            </div>

            <div className="stack">
              {payload.lines.map((line, index) => (
                <article className="line-item-card" key={`line-${index}`}>
                  <div className="actions between">
                    <span className="status-badge status-purple">Line {String(index + 1).padStart(2, "0")}</span>
                    {payload.lines.length > 1 ? (
                      <button type="button" className="btn btn-danger" onClick={() => onRemoveLine(index)}>
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="form-grid cols-3">
                    <label className="field">
                      <span className="field-label">Product</span>
                      <select
                        value={line.pricebookEntryId}
                        onChange={(event) => onProductSelected(index, event.target.value)}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.sfPricebookEntryId} value={product.sfPricebookEntryId}>
                            {product.name} ({product.currencyIsoCode} {toNumberDisplay(Number(product.unitPrice))})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">Quantity</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(index, (currentLine) => ({
                            ...currentLine,
                            quantity: Number(event.target.value)
                          }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Unit Price</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(event) =>
                          updateLine(index, (currentLine) => ({
                            ...currentLine,
                            unitPrice: Number(event.target.value)
                          }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Product Condition</span>
                      <select
                        value={line.productCondition}
                        onChange={(event) =>
                          updateLine(index, (currentLine) => ({
                            ...currentLine,
                            productCondition: event.target.value as DealLineDraft["productCondition"]
                          }))
                        }
                      >
                        {productConditions.map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">Sales Cost</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.salesCost ?? 0}
                        onChange={(event) =>
                          updateLine(index, (currentLine) => ({
                            ...currentLine,
                            salesCost: Number(event.target.value)
                          }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span className="field-label">Discount %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={line.discount ?? 0}
                        onChange={(event) =>
                          updateLine(index, (currentLine) => ({
                            ...currentLine,
                            discount: Number(event.target.value)
                          }))
                        }
                      />
                    </label>
                  </div>

                  {payload.fundingType === "Subscription" ? (
                    <div className="subsection">
                      <div className="panel-head">
                        <span className="field-label">Subscription Terms</span>
                        <span className="status-badge status-cyan">Recurring</span>
                      </div>

                      <div className="form-grid cols-3">
                        <label className="field">
                          <span className="field-label">Subscription Start Date</span>
                          <input
                            type="date"
                            value={line.subscriptionStartDate ?? ""}
                            onChange={(event) =>
                              updateLine(index, (currentLine) => ({
                                ...currentLine,
                                subscriptionStartDate: event.target.value
                              }))
                            }
                          />
                        </label>

                        <label className="field">
                          <span className="field-label">Subscription Term (Months)</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={line.subscriptionTermMonths ?? 12}
                            onChange={(event) =>
                              updateLine(index, (currentLine) => ({
                                ...currentLine,
                                subscriptionTermMonths: Number(event.target.value)
                              }))
                            }
                          />
                        </label>

                        <label className="field">
                          <span className="field-label">Contract Type</span>
                          <select
                            value={line.contractTypeSoftware ?? ""}
                            onChange={(event) =>
                              updateLine(index, (currentLine) => ({
                                ...currentLine,
                                contractTypeSoftware: event.target.value
                              }))
                            }
                          >
                            <option value="">Select contract type</option>
                            {contractTypes.map((contractType) => (
                              <option key={contractType} value={contractType}>
                                {contractType}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span className="field-label">Billing Commitment</span>
                          <select
                            value={line.subscriptionBillingCommitment ?? ""}
                            onChange={(event) =>
                              updateLine(index, (currentLine) => ({
                                ...currentLine,
                                subscriptionBillingCommitment: event.target.value
                              }))
                            }
                          >
                            <option value="">Select commitment</option>
                            {billingCommitments.map((commitment) => (
                              <option key={commitment} value={commitment}>
                                {commitment}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span className="field-label">Billing Plan</span>
                          <select
                            value={line.subscriptionBillingPlan ?? ""}
                            onChange={(event) =>
                              updateLine(index, (currentLine) => ({
                                ...currentLine,
                                subscriptionBillingPlan: event.target.value
                              }))
                            }
                          >
                            <option value="">Select plan</option>
                            {billingPlans.map((plan) => (
                              <option key={plan} value={plan}>
                                {plan}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-body">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Line Item Snapshot</h2>
                <p className="panel-subtitle">Operational readout of all current line values.</p>
              </div>
              <span className="status-badge status-cyan">{payload.lines.length.toString().padStart(2, "0")} rows</span>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Condition</th>
                    <th>Cost</th>
                    <th>Disc %</th>
                    <th>Start</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.lines.length === 0 ? (
                    <tr>
                      <td className="empty-row" colSpan={8}>
                        No line items created.
                      </td>
                    </tr>
                  ) : (
                    payload.lines.map((line, index) => {
                      const selectedProduct = products.find((product) => product.sfPricebookEntryId === line.pricebookEntryId);
                      return (
                        <tr key={`snapshot-${index}`}>
                          <td>{String(index + 1).padStart(2, "0")}</td>
                          <td className="text-cell">{selectedProduct?.name ?? "Not selected"}</td>
                          <td>{String(line.quantity)}</td>
                          <td>{toNumberDisplay(line.unitPrice)}</td>
                          <td>{line.productCondition}</td>
                          <td>{toNumberDisplay(line.salesCost)}</td>
                          <td>{toNumberDisplay(line.discount)}</td>
                          <td>{line.subscriptionStartDate || "--"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-body">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Submission</h2>
                <p className="panel-subtitle">Validate the draft, then submit to Salesforce.</p>
              </div>
              <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={status.type === "running"}>
                {status.type === "running" ? "Submitting..." : "Validate and Submit"}
              </button>
            </div>

            <div className="actions">
              <span className="status-badge status-neutral">StageName=Open and LOB=Software Licensing</span>
            </div>

            {blockingValidationErrors.length > 0 ? (
              <div className="alert error">
                <div className="alert-list">
                  {blockingValidationErrors.map((error, index) => (
                    <div key={`block-${index}`}>
                      {error.field}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {warningValidationErrors.length > 0 ? (
              <div className="alert warn">
                <div className="alert-list">
                  {warningValidationErrors.map((warning, index) => (
                    <div key={`warn-${index}`}>
                      {warning.field}: {warning.message}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {serverErrors.length > 0 ? (
              <div className="alert error">
                <div className="alert-list">
                  {serverErrors.map((error, index) => (
                    <div key={`server-${index}`}>
                      {error.portalField}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {status.type === "success" ? (
              <div className="alert success">
                <div>{status.message}</div>
                {status.sfOppId ? <div className="small-note data-text">Salesforce Opportunity ID: {status.sfOppId}</div> : null}
              </div>
            ) : null}

            {status.type === "error" ? <div className="alert error">{status.message}</div> : null}

            {status.type === "running" ? <div className="alert info">Composite API submission in progress...</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
