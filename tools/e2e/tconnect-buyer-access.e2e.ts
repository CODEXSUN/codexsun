import { TconnectTestSession as Session } from "./tconnect-test-session.js";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { env } from "../../apps/platform/api/src/env.js";
const anonymous = new Session();
const buyers = [new Session(), new Session()];
const password = (email: string) =>
  `Tc!${createHmac("sha256", env.JWT_SECRET).update(`codexsun:tconnect:buyer:e2e:${email}`).digest("hex")}`;
for (let index = 0; index < 2; index++) {
  const email = `tconnect-buyer-${index + 1}@example.invalid`;
  const input = {
    corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
    name: `Test Buyer ${index + 1}`,
    email,
    password: password(email),
    businessName: `Tirupur Test Sourcing ${index + 1}`,
    city: "Tirupur",
    phone: "9999999999",
    consent: true
  };
  assert.equal(
    (
      await anonymous.request("POST", "/public/tconnect/buyer/registration", {
        ...input,
        roleId: 1
      })
    ).status,
    400
  );
  assert.equal(
    (
      await anonymous.request("POST", "/public/tconnect/buyer/registration", {
        ...input,
        corporateId: "WRONG"
      })
    ).status,
    400
  );
  const result = await anonymous.request("POST", "/public/tconnect/buyer/registration", input);
  assert.ok([200, 409].includes(result.status), `Buyer registration failed: ${result.status}`);
  await buyers[index]!.login(email, password(email));
  assert.equal((await buyers[index]!.request("GET", "/tconnect/buyer/session")).status, 200);
  for (const path of [
    "/tconnect/company",
    "/tconnect/product",
    "/tconnect/member",
    "/tconnect/inquiry",
    "/tenant/access/users",
    "/tenant/access/roles",
    "/tconnect/requirement/board"
  ]) {
    assert.equal(
      (await buyers[index]!.request("GET", path)).status,
      403,
      `Buyer must not access ${path}`
    );
  }
}
const first = buyers[0]!;
const second = buyers[1]!;
const admin = new Session();
const seller = new Session();
await admin.login(env.DEFAULT_TENANT_ADMIN_EMAIL, env.DEFAULT_TENANT_ADMIN_PASSWORD);
const sellerEmail = "tconnect-seller-a@example.invalid";
const sellerPassword = `Tc!${createHmac("sha256", env.JWT_SECRET).update(`codexsun:tconnect:e2e:${sellerEmail}`).digest("hex")}`;
const sellerRegistration = await anonymous.request("POST", "/public/tconnect/registration", {
  corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
  name: "TConnect test seller",
  email: sellerEmail,
  password: sellerPassword,
  companyName: "TConnect E2E Seller A",
  industry: "Textiles & Apparel",
  city: "Tirupur",
  accountType: "seller",
  associationUuid: null,
  membershipNumber: "",
  consent: true,
  website: ""
});
assert.ok([200, 409].includes(sellerRegistration.status));
const member = (
  await admin.request<{ uuid: string; companyUuid: string; email: string }[]>(
    "GET",
    "/tconnect/member"
  )
).data.find((row) => row.email === sellerEmail);
assert.ok(member);
assert.equal(
  (
    await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
      membershipStatus: "rejected",
      status: "active"
    })
  ).status,
  200
);
await seller.login(sellerEmail, sellerPassword);
const company = (await seller.request<Record<string, unknown>[]>("GET", "/tconnect/company"))
  .data[0]!;
const { uuid: companyUuid, ...companyInput } = company;
assert.equal(
  (
    await seller.request("PUT", `/tconnect/company/${companyUuid}`, {
      ...companyInput,
      status: "active"
    })
  ).status,
  200
);
const existingProducts = (
  await seller.request<{ uuid: string; companyUuid: string; name: string }[]>(
    "GET",
    "/tconnect/product"
  )
).data;
let ownedProduct = existingProducts[0];
if (!ownedProduct) {
  const created = await seller.request<{ uuid: string; companyUuid: string; name: string }>(
    "POST",
    "/tconnect/product",
    {
      companyUuid,
      name: "Buyer test cotton T-shirt",
      category: "Knitwear",
      description: "An illustrative cotton T-shirt for buyer enquiry integration tests.",
      price: 150,
      unit: "piece",
      minimumOrder: "500 pieces",
      imageDataUrl: "",
      status: "active"
    }
  );
  assert.equal(created.status, 200);
  ownedProduct = created.data;
}

const requirementInput = {
  title: "Buyer E2E cotton sourcing",
  category: "Textiles",
  description: "Looking for organic cotton products for a Tirupur sourcing requirement.",
  quantity: "500 pieces",
  deliveryCity: "Tirupur",
  budget: 100000,
  status: "draft"
};
const requirement = await first.request<{ uuid: string }>(
  "POST",
  "/tconnect/requirement",
  requirementInput
);
assert.equal(requirement.status, 200);
const uuid = requirement.data.uuid;
try {
  const draftBoard = await seller.request<{ uuid: string }[]>("GET", "/tconnect/requirement/board");
  assert.equal(draftBoard.status, 200);
  assert.ok(!draftBoard.data.some((row) => row.uuid === uuid));
  assert.equal(
    (
      await second.request("PUT", `/tconnect/requirement/${uuid}`, {
        ...requirementInput,
        status: "open"
      })
    ).status,
    404
  );
  const other = await second.request<{ uuid: string }[]>("GET", "/tconnect/requirement");
  assert.ok(!other.data.some((row) => row.uuid === uuid));
  assert.equal(
    (
      await first.request("POST", "/tconnect/requirement", {
        ...requirementInput,
        buyerUuid: "a0000001"
      })
    ).status,
    400
  );
  assert.equal(
    (
      await first.request("PUT", `/tconnect/requirement/${uuid}`, {
        ...requirementInput,
        status: "open"
      })
    ).status,
    200
  );
  const openBoard = await seller.request<{ uuid: string }[]>("GET", "/tconnect/requirement/board");
  assert.ok(openBoard.data.some((row) => row.uuid === uuid));
  const catalog = await first.request<{ uuid: string; companyUuid: string; name: string }[]>(
    "GET",
    "/tconnect/product/search?q="
  );
  assert.equal(catalog.status, 200);
  assert.ok(catalog.data.length > 0, "Seeded published catalog required");
  const product = ownedProduct!;
  const search = await first.request<{ uuid: string }[]>(
    "GET",
    `/tconnect/product/search?q=${encodeURIComponent(product.name)}`
  );
  assert.ok(search.data.some((row) => row.uuid === product.uuid));
  const enquiry = {
    companyUuid: product.companyUuid,
    productUuid: product.uuid,
    requirementUuid: uuid,
    phone: "9999999999",
    requirement: "Please share a quotation and delivery availability for the selected product.",
    quantity: "500 pieces",
    consent: true
  };
  assert.equal(
    (await second.request("POST", "/tconnect/inquiry/buyer", enquiry)).status,
    404,
    "Cannot link another buyer's requirement"
  );
  assert.equal(
    (
      await first.request("POST", "/tconnect/inquiry/buyer", {
        ...enquiry,
        email: "spoof@example.invalid"
      })
    ).status,
    400
  );
  assert.equal(
    (
      await first.request("POST", "/tconnect/inquiry/buyer", {
        ...enquiry,
        productUuid: "00000000"
      })
    ).status,
    404
  );
  const sent = await first.request<{ uuid: string }>("POST", "/tconnect/inquiry/buyer", enquiry);
  assert.equal(sent.status, 200);
  const own = await first.request<{ uuid: string; email: string; requirementUuid: string }[]>(
    "GET",
    "/tconnect/inquiry/sent"
  );
  const row = own.data.find((row) => row.uuid === sent.data.uuid);
  assert.equal(row?.email, "tconnect-buyer-1@example.invalid");
  assert.equal(row?.requirementUuid, uuid);
  const inbox = await seller.request<{ uuid: string; email: string }[]>("GET", "/tconnect/inquiry");
  assert.ok(
    inbox.data.some(
      (row) => row.uuid === sent.data.uuid && row.email === "tconnect-buyer-1@example.invalid"
    )
  );
  assert.equal(
    (await seller.request("PUT", `/tconnect/inquiry/${sent.data.uuid}`, { status: "contacted" }))
      .status,
    200
  );
  const tracked = await first.request<{ uuid: string; status: string }[]>(
    "GET",
    "/tconnect/inquiry/sent"
  );
  assert.equal(tracked.data.find((row) => row.uuid === sent.data.uuid)?.status, "contacted");
  const others = await second.request<{ uuid: string }[]>("GET", "/tconnect/inquiry/sent");
  assert.ok(!others.data.some((row) => row.uuid === sent.data.uuid));
  assert.equal(
    (await first.request("PUT", `/tconnect/inquiry/${sent.data.uuid}`, { status: "closed" }))
      .status,
    403
  );
  console.info(
    "Buyer registration, Platform cookie login, requirement ownership, catalog search, identity derivation and enquiry isolation passed."
  );
} finally {
  assert.equal(
    (
      await first.request("PUT", `/tconnect/requirement/${uuid}`, {
        ...requirementInput,
        status: "closed"
      })
    ).status,
    200
  );
  const closedBoard = await seller.request<{ uuid: string }[]>(
    "GET",
    "/tconnect/requirement/board"
  );
  assert.ok(!closedBoard.data.some((row) => row.uuid === uuid));
  await admin.request("PUT", `/tconnect/company/${companyUuid}`, {
    ...companyInput,
    status: "inactive"
  });
  await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
    membershipStatus: "rejected",
    status: "inactive"
  });
  for (const session of [...buyers, seller, admin])
    await session.request("POST", "/auth/logout", { desk: "tenant" });
}
