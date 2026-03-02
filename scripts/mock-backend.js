const http = require("http");
const { randomUUID } = require("crypto");

const port = 8080;

const picklists = {
  "Opportunity.StageName": [
    "Open",
    "Qualify & Develop",
    "Presented & Negotiated",
    "Closed Won",
    "Closed Lost"
  ],
  "Opportunity.Funding_Type__c": [
    "Cash",
    "Lease",
    "Internal Rental",
    "Subscription"
  ],
  "Opportunity.CurrencyIsoCode": ["GBP", "USD", "EUR"],
  "OpportunityLineItem.Product_Condition__c": [
    "New",
    "Refurbished",
    "Retained"
  ],
  "OpportunityLineItem.Contract_Type_Software__c": ["Standard"],
  "OpportunityLineItem.Subscription_Billing_Commitment__c": [
    "1 Month(s)",
    "1 Year(s)",
    "N/A"
  ],
  "OpportunityLineItem.Subscription_Billing_Plan__c": [
    "Monthly",
    "Annually",
    "N/A"
  ]
};

const accounts = [
  {
    sfAccountId: "001000000000001AAA",
    name: "Xeretec Demo Account",
    accountNumber: "XER001",
    billingCity: "Birmingham"
  },
  {
    sfAccountId: "001000000000002AAA",
    name: "Acme Software Ltd",
    accountNumber: "ACM123",
    billingCity: "London"
  }
];

const products = [
  {
    sfProduct2Id: "01t000000000001AAA",
    name: "Microsoft 365 E3",
    lineOfBusiness: "Software Licensing",
    productSubType: "Software",
    productCategory: "Software Licensing",
    sfPricebookEntryId: "01u000000000001AAA",
    sfPricebook2Id: "01s4K000005dhNAQAY",
    pricebookName: "Standard Price Book",
    currencyIsoCode: "GBP",
    unitPrice: 49.99,
    productCode: "SW-365-E3"
  },
  {
    sfProduct2Id: "01t000000000002AAA",
    name: "DEL - S/W LIC",
    lineOfBusiness: "Software Licensing",
    productSubType: "Delivery",
    productCategory: "Software Licensing",
    sfPricebookEntryId: "01u000000000002AAA",
    sfPricebook2Id: "01s4K000005dhNAQAY",
    pricebookName: "Standard Price Book",
    currencyIsoCode: "GBP",
    unitPrice: 0,
    productCode: "DEL - S/W LIC"
  }
];

function sendJson(res, code, payload) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(payload));
}

function collectBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { message: "Invalid request" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${port}`);
  const path = url.pathname;

  if (path === "/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, mode: "mock" });
    return;
  }

  if (path === "/api/accounts" && req.method === "GET") {
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const filtered = q
      ? accounts.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.accountNumber || "").toLowerCase().includes(q)
        )
      : accounts;
    sendJson(res, 200, { records: filtered });
    return;
  }

  if (path === "/api/products" && req.method === "GET") {
    const lob = url.searchParams.get("lob");
    const currency = url.searchParams.get("currency");
    const filtered = products.filter(
      (p) =>
        (!lob || p.lineOfBusiness === lob) &&
        (!currency || p.currencyIsoCode === currency)
    );
    sendJson(res, 200, { records: filtered });
    return;
  }

  if (path.startsWith("/api/picklists/") && req.method === "GET") {
    const parts = path.split("/").filter(Boolean);
    const objectApiName = parts[2];
    const fieldApiName = parts[3];
    const key = `${objectApiName}.${fieldApiName}`;
    const values = (picklists[key] || []).map((value) => ({ value }));
    sendJson(res, 200, { records: values });
    return;
  }

  if (path === "/api/sync/reference-data" && req.method === "POST") {
    sendJson(res, 200, {
      success: true,
      accountsSynced: accounts.length,
      pricebookEntriesSynced: products.length
    });
    return;
  }

  if (path === "/api/deals" && req.method === "POST") {
    await collectBody(req);
    sendJson(res, 201, { deal: { id: randomUUID() } });
    return;
  }

  if (
    /^\/api\/deals\/[0-9a-fA-F-]+\/submit$/.test(path) &&
    req.method === "POST"
  ) {
    sendJson(res, 200, {
      success: true,
      status: "synced",
      sfOppId: "006000000000001AAA"
    });
    return;
  }

  sendJson(res, 404, { message: "Not found", path, method: req.method });
});

server.listen(port, () => {
  console.log(`Mock backend listening on http://localhost:${port}`);
});
