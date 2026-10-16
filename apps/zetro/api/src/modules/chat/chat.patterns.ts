export const ZETRO_QUERY_PATTERNS = [
  {
    uuid: "010f0000-0000-4000-8000-000000000001",
    serialNo: 1,
    intent: "business_chat",
    questionPattern: "Business process, drafting, summary, or planning using user-provided facts",
    queryPattern: "business_chat",
    limitation: "No company record read or write",
    extra: "Ask for missing facts. Label drafts and suggestions."
  },
  {
    uuid: "010f0000-0000-4000-8000-000000000002",
    serialNo: 2,
    intent: "customer_outstanding",
    questionPattern: "What does an exact customer name or code owe or need to pay?",
    queryPattern: "billing.customer-outstanding.read",
    limitation: "Needs an active role grant and Billing permission; one exact customer only",
    extra: "Use Billing Customer Summary for the server-selected company and financial year."
  },
  {
    uuid: "010f0000-0000-4000-8000-000000000003",
    serialNo: 3,
    intent: "off_topic",
    questionPattern: "Entertainment or unrelated personal request",
    queryPattern: "none",
    limitation: "Business scope only; no data query",
    extra: "Give a short business-scope response."
  },
  {
    uuid: "010f0000-0000-4000-8000-000000000004",
    serialNo: 4,
    intent: "today_report",
    questionPattern:
      "Today's business report, activity, or totals across sales, purchases, receipts, and payments",
    queryPattern: "billing.daily-summary.read",
    limitation:
      "Active role grant and Billing records permission; current company and financial year only",
    extra: "Count confirmed sales and purchases and posted receipts and payments dated today."
  },
  {
    uuid: "010f0000-0000-4000-8000-000000000005",
    serialNo: 5,
    intent: "month_report",
    questionPattern:
      "This month's sales, purchases, receipts, or payments, individually or together",
    queryPattern: "billing.monthly-summary.read",
    limitation:
      "Active role grant and Billing records permission; current calendar month and scope only",
    extra: "Include export sales with sales. State the exact period and document statuses."
  },
  {
    uuid: "010f0000-0000-4000-8000-000000000006",
    serialNo: 6,
    intent: "long_outstanding_sales",
    questionPattern: "Oldest unpaid sales invoices or long outstanding sales",
    queryPattern: "billing.aged-sales.read",
    limitation:
      "Active role grant and Billing records permission; ten oldest invoices aged at least 30 days",
    extra: "Use posted receipt allocations and show invoice, customer, age, and remaining amount."
  },
  {
    uuid: "010f0000-0000-4000-8000-000000000007",
    serialNo: 7,
    intent: "assigned_enquiries",
    questionPattern: "How many CRM enquiries are assigned to me, open, new, or need attention?",
    queryPattern: "crm.assigned-enquiries.read",
    limitation:
      "Active role grant and CRM enquiry view permission; only the signed user's assigned Local enquiries",
    extra: "Use the CRM scoped summary. State that Frappe-sourced enquiries are excluded."
  },
  {
    uuid: "010f0000-0000-4000-8000-000000000036",
    serialNo: 36,
    intent: "developer_docs",
    questionPattern: "/docs followed by an application or module query",
    queryPattern: "docs.developer.read",
    limitation:
      "Signed Zetro chat user plus active Docs and docs.knowledge.view; bounded reference excerpts only",
    extra:
      "Read-only developer evidence with source/hash/revision citations. Never execute documentation."
  }
] as const;

// Review proposals have no runtime intent or executable query. A catalog row cannot grant access.
export const ZETRO_REVIEW_PATTERNS = [
  [
    8,
    "What do we owe an exact supplier?",
    "billing.supplier-outstanding.read",
    "Supplier identity and payable sign must be verified; separate grant required",
    "Billing Supplier Summary"
  ],
  [
    9,
    "Show an exact customer's statement for a period",
    "billing.customer-statement.read",
    "Date range, company, financial year, and row limit required",
    "Billing Customer Statement"
  ],
  [
    10,
    "Show an exact supplier's statement for a period",
    "billing.supplier-statement.read",
    "Date range, company, financial year, and row limit required",
    "Billing Supplier Statement"
  ],
  [
    11,
    "Find a sales invoice by exact number and show status or amount",
    "billing.sales-invoice.read",
    "Exact number and company scope; no writes",
    "Billing Sales"
  ],
  [
    12,
    "Find an export sales invoice by exact number",
    "billing.export-sales-invoice.read",
    "Exact number and company scope; no writes",
    "Billing Export Sales"
  ],
  [
    13,
    "Find a purchase by exact number and show status or amount",
    "billing.purchase.read",
    "Exact number and company scope; no writes",
    "Billing Purchase"
  ],
  [
    14,
    "Find a receipt by exact number and show posting or allocation",
    "billing.receipt.read",
    "Exact number and company scope; payment details need a separate review",
    "Billing Receipt"
  ],
  [
    15,
    "Find a payment by exact number and show posting",
    "billing.payment.read",
    "Exact number and company scope; sensitive payment details are excluded",
    "Billing Payment"
  ],
  [
    16,
    "Find a quotation by exact number and show status",
    "billing.quotation.read",
    "Exact number and company scope; no conversion action",
    "Billing Quotation"
  ],
  [
    17,
    "What stock is available for an exact item?",
    "billing.stock-statement.read",
    "Item identity, warehouse, unit, and as-of date need a fixed contract",
    "Billing Stock Statement"
  ],
  [
    18,
    "What does the GST statement show for a period?",
    "billing.gst-statement.read",
    "Tax period and legal scope need review before any amount is shown",
    "Billing GST Statement"
  ],
  [
    19,
    "Which suppliers have the oldest payable balances?",
    "billing.aged-suppliers.read",
    "Define aging and currency; cap rows and require a grant",
    "Supplier Summary and payments"
  ],
  [
    20,
    "Compare sales or purchases across two periods",
    "billing.period-comparison.read",
    "Bounded periods, statuses, currency, and company scope required",
    "Billing Dashboard"
  ],
  [
    21,
    "Which customers bought the most in a period?",
    "billing.top-customers.read",
    "Define ranking and currency; cap rows and require a grant",
    "Billing Sales and Export Sales"
  ],
  [
    22,
    "Which suppliers supplied the most in a period?",
    "billing.top-suppliers.read",
    "Define ranking and currency; cap rows and require a grant",
    "Billing Purchase"
  ],
  [
    23,
    "What was an exact party's opening balance?",
    "billing.opening-balance.read",
    "Party role, company, financial year, and sign must be explicit",
    "Billing Opening Balance"
  ],
  [
    24,
    "Find an enquiry by exact number and show status",
    "crm.enquiry-by-number.read",
    "Respect assigned or created visibility and selected data source",
    "CRM Enquiry"
  ],
  [
    25,
    "Show enquiries for an exact customer",
    "crm.customer-enquiries.read",
    "Resolve duplicate contacts; respect row visibility and source",
    "CRM Enquiry"
  ],
  [
    26,
    "Which assigned enquiries are overdue?",
    "crm.overdue-enquiries.read",
    "Only visible rows; define open statuses and today from database",
    "CRM Enquiry"
  ],
  [
    27,
    "Count visible enquiries by status",
    "crm.enquiry-status-summary.read",
    "Respect assigned or created visibility and selected source",
    "CRM Enquiry reports"
  ],
  [
    28,
    "Count visible enquiries by priority",
    "crm.enquiry-priority-summary.read",
    "Respect row visibility and selected source",
    "CRM Enquiry summary"
  ],
  [
    29,
    "Show enquiries assigned to a named colleague",
    "crm.assignee-enquiries.read",
    "Requires view-all in addition to grant; exact employee",
    "CRM Enquiry reports"
  ],
  [
    30,
    "Show enquiries in an exact list or group",
    "crm.list-enquiries.read",
    "Respect row visibility and selected source",
    "CRM List In and Enquiry"
  ],
  [
    31,
    "Summarize recent activity on an exact enquiry",
    "crm.enquiry-activity.read",
    "Verify enquiry visibility; bound comments and remove private notes",
    "CRM Enquiry activity"
  ],
  [
    32,
    "What work or estimates are attached to an enquiry?",
    "crm.enquiry-work.read",
    "Verify enquiry visibility; distinguish estimates from actuals",
    "CRM Enquiry jobs and estimates"
  ],
  [
    33,
    "Who is the contact person for an exact customer?",
    "crm.contact-person.read",
    "Contact permission and field-level privacy review required",
    "CRM Contact People"
  ],
  [
    34,
    "Give an exact customer's CRM history",
    "crm.contact-360.read",
    "Combine only independently authorized records; cap history",
    "CRM Contact 360"
  ],
  [
    35,
    "How many enquiries were won or lost in a period?",
    "crm.conversion-summary.read",
    "Define date basis and statuses; respect row visibility",
    "CRM Enquiry reports"
  ]
].map(([serialNo, questionPattern, queryPattern, limitation, extra]) => ({
  uuid: `010f0000-0000-4000-8000-${String(serialNo).padStart(12, "0")}`,
  serialNo: Number(serialNo),
  questionPattern: String(questionPattern),
  queryPattern: String(queryPattern),
  limitation: String(limitation),
  extra: String(extra)
}));

export const ZETRO_RECORD_CAPABILITIES = [
  "billing.customer-outstanding.read",
  "billing.daily-summary.read",
  "billing.monthly-summary.read",
  "billing.aged-sales.read",
  "crm.assigned-enquiries.read"
] as const;

export type ZetroRecordCapability = (typeof ZETRO_RECORD_CAPABILITIES)[number];

export function patternUuidForIntent(intent: string) {
  return ZETRO_QUERY_PATTERNS.find((pattern) => pattern.intent === intent)?.uuid ?? null;
}
