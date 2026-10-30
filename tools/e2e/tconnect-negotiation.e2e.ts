import { TconnectTestSession as Session } from "./tconnect-test-session.js";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { env } from "../../apps/platform/api/src/env.js";
type Quote = {
  uuid: string;
  conversationUuid: string;
  requirementUuid: string | null;
  inquiryUuid: string | null;
  total: number;
  subtotal: number;
  taxAmount: number;
  status: string;
};
type MessagePage = {
  messages: { uuid: string; body: string; senderSide: string }[];
  nextBefore: string | null;
};
const admin = new Session();
const anonymous = new Session();
const sellers = [new Session(), new Session()];
const buyers = [new Session(), new Session()];
await admin.login(env.DEFAULT_TENANT_ADMIN_EMAIL, env.DEFAULT_TENANT_ADMIN_PASSWORD);
const password = (email: string, scope: string) =>
  `Tc!${createHmac("sha256", env.JWT_SECRET).update(`codexsun:tconnect:${scope}e2e:${email}`).digest("hex")}`;
const members: {
  uuid: string;
  companyUuid: string;
  email: string;
  requestedAssociationUuid: string | null;
}[] = [];
const companies: Record<string, unknown>[] = [];
const requirements: string[] = [];
const quotations: { uuid: string; seller: number }[] = [];
const requirement = {
  title: `Quotation E2E cotton sourcing ${Date.now().toString(36)}`,
  category: "Textiles",
  description: "Need 500 organic cotton T-shirts, 180 GSM, for delivery in Tirupur.",
  quantity: "500 pieces",
  deliveryCity: "Tirupur",
  budget: 100000,
  status: "open"
};
try {
  for (let index = 0; index < 2; index++) {
    const email = `tconnect-buyer-${index + 1}@example.invalid`;
    const registration = await anonymous.request("POST", "/public/tconnect/buyer/registration", {
      corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
      name: `Test Buyer ${index + 1}`,
      email,
      password: password(email, "buyer:"),
      businessName: `Tirupur Test Sourcing ${index + 1}`,
      city: "Tirupur",
      phone: "9999999999",
      consent: true
    });
    assert.ok([200, 409].includes(registration.status));
    await buyers[index]!.login(email, password(email, "buyer:"));
    const sellerEmail =
      index === 0 ? "tconnect-seller-a@example.invalid" : "tconnect-member-b@example.invalid";
    const registered = await anonymous.request("POST", "/public/tconnect/registration", {
      corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
      name: `TConnect test ${index + 1}`,
      email: sellerEmail,
      password: password(sellerEmail, ""),
      companyName: `TConnect E2E ${index + 1}`,
      industry: "Textiles & Apparel",
      city: "Tirupur",
      accountType: "seller",
      associationUuid: null,
      membershipNumber: "",
      consent: true,
      website: ""
    });
    assert.ok([200, 409].includes(registered.status));
    const allMembers = await admin.request<typeof members>("GET", "/tconnect/member");
    const member = allMembers.data.find((row) => row.email === sellerEmail);
    assert.ok(member);
    members.push(member);
    assert.equal(
      (
        await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
          membershipStatus: member.requestedAssociationUuid ? "approved" : "rejected",
          status: "active"
        })
      ).status,
      200
    );
    await sellers[index]!.login(sellerEmail, password(sellerEmail, ""));
    const company = (
      await sellers[index]!.request<Record<string, unknown>[]>("GET", "/tconnect/company")
    ).data[0]!;
    companies.push(company);
    const { uuid, ...payload } = company;
    assert.equal(
      (
        await sellers[index]!.request("PUT", `/tconnect/company/${uuid}`, {
          ...payload,
          status: "active"
        })
      ).status,
      200
    );
  }
  const buyer = buyers[0]!;
  const otherBuyer = buyers[1]!;
  const seller = sellers[0]!;
  const competitor = sellers[1]!;
  const created = await buyer.request<{ uuid: string }>(
    "POST",
    "/tconnect/requirement",
    requirement
  );
  assert.equal(created.status, 200);
  const requirementUuid = created.data.uuid;
  requirements.push(requirementUuid);
  const target = { requirementUuid, inquiryUuid: null };
  const thread = await seller.request<{ uuid: string }>("POST", "/tconnect/conversation", target);
  assert.equal(thread.status, 200);
  const threadUuid = thread.data.uuid;
  assert.equal(
    (await seller.request<{ uuid: string }>("POST", "/tconnect/conversation", target)).data.uuid,
    threadUuid,
    "Opening twice reuses one private thread"
  );
  const competing = await competitor.request<{ uuid: string }>(
    "POST",
    "/tconnect/conversation",
    target
  );
  assert.equal(competing.status, 200);
  assert.notEqual(competing.data.uuid, threadUuid);
  assert.equal((await buyer.request("POST", "/tconnect/conversation", target)).status, 403);
  assert.equal(
    (await seller.request("POST", "/tconnect/conversation", { ...target, buyerUuid: "a0000001" }))
      .status,
    400
  );
  for (const outsider of [otherBuyer, competitor]) {
    assert.equal(
      (await outsider.request("GET", `/tconnect/conversation/${threadUuid}`)).status,
      404
    );
    assert.equal(
      (await outsider.request("GET", `/tconnect/conversation/${threadUuid}/messages`)).status,
      404
    );
    assert.equal(
      (
        await outsider.request("POST", `/tconnect/conversation/${threadUuid}/messages`, {
          body: "Forbidden message"
        })
      ).status,
      404
    );
    assert.equal(
      (await outsider.request("GET", `/tconnect/quotation?conversationUuid=${threadUuid}`)).status,
      404
    );
  }
  assert.equal(
    (await admin.request("GET", "/tconnect/conversation")).status,
    403,
    "Staff has no implicit participant access"
  );
  const sellerMessage = await seller.request<{ uuid: string; senderSide: string }>(
    "POST",
    `/tconnect/conversation/${threadUuid}/messages`,
    { body: "We can supply certified 180 GSM cotton in fourteen days." }
  );
  assert.equal(sellerMessage.status, 200);
  assert.equal(sellerMessage.data.senderSide, "seller");
  assert.equal(
    (
      await buyer.request("POST", `/tconnect/conversation/${threadUuid}/messages`, {
        body: "Please quote with shipping to Tirupur included."
      })
    ).status,
    200
  );
  assert.equal(
    (
      await buyer.request("POST", `/tconnect/conversation/${threadUuid}/messages`, {
        body: "Impersonation",
        senderSide: "seller"
      })
    ).status,
    400
  );
  const history = await buyer.request<MessagePage>(
    "GET",
    `/tconnect/conversation/${threadUuid}/messages`
  );
  assert.equal(history.status, 200);
  assert.equal(history.data.messages[0]?.uuid, sellerMessage.data.uuid);
  assert.equal(history.data.messages[1]?.senderSide, "buyer");
  assert.equal(
    (await buyer.request("GET", `/tconnect/conversation/${threadUuid}/messages?before=00000000`))
      .status,
    404
  );
  const quoteInput = {
    conversationUuid: threadUuid,
    quantity: 500,
    unit: "piece",
    unitPrice: 120.25,
    taxPercent: 5,
    shipping: 1000,
    deliveryDays: 14,
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    paymentTerms: "30% advance and balance before dispatch",
    notes: "180 GSM organic cotton. Includes packing."
  };
  assert.equal((await buyer.request("POST", "/tconnect/quotation", quoteInput)).status, 403);
  assert.equal((await competitor.request("POST", "/tconnect/quotation", quoteInput)).status, 404);
  assert.equal(
    (await seller.request("POST", "/tconnect/quotation", { ...quoteInput, total: 1 })).status,
    400
  );
  assert.equal(
    (
      await seller.request("POST", "/tconnect/quotation", {
        ...quoteInput,
        validUntil: "2000-01-01"
      })
    ).status,
    400
  );
  const quoted = await seller.request<{ uuid: string }>("POST", "/tconnect/quotation", quoteInput);
  assert.equal(quoted.status, 200);
  quotations.push({ uuid: quoted.data.uuid, seller: 0 });
  const quotedOther = await competitor.request<{ uuid: string }>("POST", "/tconnect/quotation", {
    ...quoteInput,
    conversationUuid: competing.data.uuid,
    unitPrice: 125,
    shipping: 0,
    deliveryDays: 10
  });
  assert.equal(quotedOther.status, 200);
  quotations.push({ uuid: quotedOther.data.uuid, seller: 1 });
  const received = await buyer.request<Quote[]>("GET", "/tconnect/quotation");
  assert.equal(received.status, 200);
  const first = received.data.find((row) => row.uuid === quoted.data.uuid);
  assert.equal(first?.total, 64131.25);
  assert.equal(first?.subtotal, 60125);
  assert.equal(first?.taxAmount, 3006.25);
  assert.equal(first?.requirementUuid, requirementUuid);
  assert.equal(received.data.find((row) => row.uuid === quotedOther.data.uuid)?.total, 65625);
  const competitorView = await competitor.request<Quote[]>("GET", "/tconnect/quotation");
  assert.ok(!competitorView.data.some((row) => row.uuid === quoted.data.uuid));
  const unrelated = await otherBuyer.request<Quote[]>("GET", "/tconnect/quotation");
  assert.ok(!unrelated.data.some((row) => row.uuid === quoted.data.uuid));
  assert.equal(
    (await competitor.request("PUT", `/tconnect/quotation/${quoted.data.uuid}/withdraw`, {}))
      .status,
    404
  );
  assert.equal(
    (await buyer.request("PUT", `/tconnect/quotation/${quoted.data.uuid}/withdraw`, {})).status,
    403
  );
  const enquiry = await buyer.request<{ uuid: string }>("POST", "/tconnect/inquiry/buyer", {
    companyUuid: members[0]!.companyUuid,
    phone: "9999999999",
    requirement: "Please provide a quotation for five hundred organic cotton T-shirts.",
    quantity: "500 pieces",
    consent: true
  });
  assert.equal(enquiry.status, 200);
  const enquiryTarget = { inquiryUuid: enquiry.data.uuid, requirementUuid: null };
  assert.equal(
    (await competitor.request("POST", "/tconnect/conversation", enquiryTarget)).status,
    404
  );
  const enquiryThread = await seller.request<{ uuid: string }>(
    "POST",
    "/tconnect/conversation",
    enquiryTarget
  );
  assert.equal(enquiryThread.status, 200);
  assert.equal(
    (await buyer.request<{ uuid: string }>("POST", "/tconnect/conversation", enquiryTarget)).data
      .uuid,
    enquiryThread.data.uuid
  );
  const enquiryQuote = await seller.request<{ uuid: string }>("POST", "/tconnect/quotation", {
    ...quoteInput,
    conversationUuid: enquiryThread.data.uuid
  });
  assert.equal(enquiryQuote.status, 200);
  quotations.push({ uuid: enquiryQuote.data.uuid, seller: 0 });
  const linked = (
    await buyer.request<Quote[]>(
      "GET",
      `/tconnect/quotation?conversationUuid=${enquiryThread.data.uuid}`
    )
  ).data;
  assert.equal(linked[0]?.inquiryUuid, enquiry.data.uuid);
  if (process.env.CODEXSUN_TCONNECT_BROWSER_CHECK === "1") {
    const { runNegotiationBrowserChecks } = await import("./tconnect-negotiation-browser.mjs");
    await runNegotiationBrowserChecks({
      platformOrigin: `http://127.0.0.1:${env.PLATFORM_WEB_PORT}`,
      corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
      buyerEmail: "tconnect-buyer-1@example.invalid",
      buyerPassword: password("tconnect-buyer-1@example.invalid", "buyer:"),
      sellerEmail: members[0]!.email,
      sellerPassword: password(members[0]!.email, ""),
      sellerName: String(companies[0]!.name),
      requirementTitle: requirement.title,
      quoteUuids: [quoted.data.uuid, quotedOther.data.uuid]
    });
  }
  assert.equal(
    (await seller.request("PUT", `/tconnect/inquiry/${enquiry.data.uuid}`, { status: "closed" }))
      .status,
    200
  );
  assert.equal(
    (
      await seller.request("POST", "/tconnect/quotation", {
        ...quoteInput,
        conversationUuid: enquiryThread.data.uuid
      })
    ).status,
    400
  );
  assert.equal(
    (
      await buyer.request("PUT", `/tconnect/requirement/${requirementUuid}`, {
        ...requirement,
        status: "closed"
      })
    ).status,
    200
  );
  assert.equal(
    (await seller.request("POST", "/tconnect/quotation", quoteInput)).status,
    404,
    "Closed requirements cannot receive new quotations"
  );
  assert.equal(
    (
      await buyer.request("POST", `/tconnect/conversation/${threadUuid}/messages`, {
        body: "Thank you. We have completed this sourcing request."
      })
    ).status,
    200,
    "History remains available after closure"
  );
  assert.equal(
    (await seller.request("PUT", `/tconnect/quotation/${quoted.data.uuid}/withdraw`, {})).status,
    200
  );
  const retained = (await buyer.request<Quote[]>("GET", "/tconnect/quotation")).data.find(
    (row) => row.uuid === quoted.data.uuid
  );
  assert.equal(retained?.status, "withdrawn");
  assert.equal(retained?.total, 64131.25, "Withdrawal preserves original terms");
  await admin.request("PUT", `/tconnect/member/${members[0]!.uuid}`, {
    membershipStatus: "rejected",
    status: "inactive"
  });
  assert.equal(
    (await seller.request("GET", "/tconnect/conversation")).status,
    403,
    "Existing seller sessions lose suspended access"
  );
  console.info(
    "PASS: requirement and enquiry quotations, exact totals, competitor isolation, buyer comparison data, two-way messages, source closure, withdrawal history and suspension."
  );
} finally {
  for (const uuid of requirements)
    await buyers[0]!.request("PUT", `/tconnect/requirement/${uuid}`, {
      ...requirement,
      status: "closed"
    });
  for (let index = 0; index < members.length; index++) {
    const member = members[index]!;
    await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
      membershipStatus: member.requestedAssociationUuid ? "approved" : "rejected",
      status: "active"
    });
    const currentQuotes = await sellers[index]!.request<Quote[]>("GET", "/tconnect/quotation");
    for (const quote of currentQuotes.data ?? [])
      if (quote.requirementUuid && requirements.includes(quote.requirementUuid))
        await sellers[index]!.request("PUT", `/tconnect/quotation/${quote.uuid}/withdraw`, {});
    for (const quote of quotations.filter((row) => row.seller === index))
      await sellers[index]!.request("PUT", `/tconnect/quotation/${quote.uuid}/withdraw`, {});
    const company = companies[index];
    if (company) {
      const { uuid, ...payload } = company;
      await admin.request("PUT", `/tconnect/company/${uuid}`, { ...payload, status: "inactive" });
    }
    await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
      membershipStatus: "rejected",
      status: "inactive"
    });
  }
  for (const session of [...sellers, ...buyers, admin])
    await session.request("POST", "/auth/logout", { desk: "tenant" });
  console.info(
    "Test requirements closed, quotations retained as withdrawn, and seller fixtures inactive."
  );
}
