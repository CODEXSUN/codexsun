import { TconnectTestSession as Session } from "./tconnect-test-session.js";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { env } from "../../apps/platform/api/src/env.js";

type Company = {
  uuid: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  city: string;
  color: string;
  initials: string;
  role: string;
  products: string;
  capacity: string;
  established: number;
  associationUuid: string | null;
  website: string;
  logoDataUrl: string;
  status: "active" | "inactive";
};
type Member = {
  uuid: string;
  companyUuid: string;
  email: string;
  requestedAssociationUuid: string | null;
  membershipStatus: string;
  status: string;
};
type Product = {
  uuid: string;
  companyUuid: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  unit: string;
  minimumOrder: string;
  imageDataUrl: string;
  status: string;
};
type Inquiry = { uuid: string; companyUuid: string; status: string };
const admin = new Session();
const anonymous = new Session();
await admin.login(env.DEFAULT_TENANT_ADMIN_EMAIL, env.DEFAULT_TENANT_ADMIN_PASSWORD);
const associationResult = await anonymous.request<{ uuid: string }[]>(
  "GET",
  "/public/tconnect/association"
);
const associationUuid = associationResult.data[0]?.uuid;
assert.ok(associationUuid, "A sample association is required");
const fixtures = [
  { email: "tconnect-seller-a@example.invalid", type: "seller", company: "TConnect E2E Seller A" },
  {
    email: "tconnect-member-b@example.invalid",
    type: "association-member",
    company: "TConnect E2E Member B"
  }
] as const;
const sessions = [new Session(), new Session()];
const companies: Company[] = [];
const members: Member[] = [];
const password = (email: string) =>
  `Tc!${createHmac("sha256", env.JWT_SECRET).update(`codexsun:tconnect:e2e:${email}`).digest("hex")}`;
try {
  for (let index = 0; index < fixtures.length; index++) {
    const fixture = fixtures[index]!;
    const payload = {
      corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
      name: `TConnect test ${index + 1}`,
      email: fixture.email,
      password: password(fixture.email),
      companyName: fixture.company,
      industry: "Textiles & Apparel",
      city: "Tirupur",
      accountType: fixture.type,
      associationUuid: fixture.type === "seller" ? null : associationUuid,
      membershipNumber: fixture.type === "seller" ? "" : "DEMO-E2E-MEMBER",
      consent: true,
      website: ""
    };
    const tampered = await anonymous.request("POST", "/public/tconnect/registration", {
      ...payload,
      roleId: 1
    });
    assert.equal(tampered.status, 400, "Registration cannot choose privileged roles");
    const wrongTenant = await anonymous.request("POST", "/public/tconnect/registration", {
      ...payload,
      corporateId: "WRONG-CORPORATE-ID"
    });
    assert.equal(wrongTenant.status, 400, "Registration requires the exact portal Corporate ID");
    const registered = await anonymous.request("POST", "/public/tconnect/registration", payload);
    assert.ok(
      [200, 409].includes(registered.status),
      "Registration must create a new account or preserve an existing fixture"
    );
    const allMembers = await admin.request<Member[]>("GET", "/tconnect/member");
    assert.equal(allMembers.status, 200);
    const member = allMembers.data.find((item) => item.email === fixture.email);
    assert.ok(member);
    members.push(member);
    if (member.status !== "active")
      assert.equal(
        (
          await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
            membershipStatus: "rejected",
            status: "active"
          })
        ).status,
        200
      );
    await sessions[index]!.login(fixture.email, password(fixture.email));
    const own = await sessions[index]!.request<Company[]>("GET", "/tconnect/company");
    assert.equal(own.status, 200);
    assert.equal(own.data.length, 1);
    assert.equal(own.data[0]?.uuid, member.companyUuid);
    companies.push(own.data[0]!);
    assert.equal(
      (await sessions[index]!.request("GET", "/tconnect/member")).status,
      403,
      "Seller cannot list member accounts"
    );
    assert.equal(
      (await sessions[index]!.request("GET", "/tenant/access/users")).status,
      403,
      "Portal accounts cannot list Platform users"
    );
    assert.equal(
      (await sessions[index]!.request("GET", "/tenant/access/roles")).status,
      403,
      "Portal accounts cannot manage Platform roles"
    );
    assert.equal(
      (await sessions[index]!.request("POST", "/tconnect/company", own.data[0])).status,
      400,
      "Strict create schema rejects record UUID injection"
    );
  }
  console.log("PASS: registration, Corporate ID checks, Platform login and one-company ownership");
  const seller = sessions[0]!;
  const other = sessions[1]!;
  const first = companies[0]!;
  const second = companies[1]!;
  const companyPayload = ({ uuid: _uuid, ...input }: Company) => input;
  assert.equal(
    (await seller.request("PUT", `/tconnect/company/${second.uuid}`, companyPayload(second)))
      .status,
    403,
    "A seller cannot edit another company's profile"
  );
  assert.equal(
    (
      await seller.request("PUT", `/tconnect/company/${first.uuid}`, {
        ...companyPayload(first),
        associationUuid
      })
    ).status,
    403,
    "A seller cannot self-assign association membership"
  );
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5S8AAAAASUVORK5CYII=";
  assert.equal(
    (
      await seller.request("PUT", `/tconnect/company/${first.uuid}`, {
        ...companyPayload(first),
        logoDataUrl: "data:image/svg+xml;base64,PHN2Zy8+"
      })
    ).status,
    400,
    "Executable logo formats are rejected"
  );
  const published = await seller.request<Company>("PUT", `/tconnect/company/${first.uuid}`, {
    ...companyPayload(first),
    description: "TConnect end-to-end verification company. This is a fictional test profile.",
    tagline: "Ownership verification",
    logoDataUrl: png,
    status: "active"
  });
  assert.equal(published.status, 200);
  assert.equal(published.data.logoDataUrl, png);
  companies[0] = published.data;
  const spoofed = await seller.request<Company[]>("GET", "/tconnect/company", undefined, {
    "x-tenant-id": "untrusted",
    "x-tenant-db": "untrusted"
  });
  assert.equal(spoofed.data.length, 1);
  assert.equal(spoofed.data[0]?.uuid, first.uuid, "Browser tenant headers cannot change scope");
  const productInput = {
    companyUuid: first.uuid,
    name: "E2E cotton T-shirt",
    category: "Knitwear",
    description: "Fictional product used to verify seller catalog isolation.",
    price: 125,
    unit: "piece",
    minimumOrder: "100 pieces",
    imageDataUrl: png,
    status: "active"
  };
  const productA = await seller.request<Product>("POST", "/tconnect/product", productInput);
  assert.equal(productA.status, 200);
  const productB = await other.request<Product>("POST", "/tconnect/product", {
    ...productInput,
    companyUuid: second.uuid,
    name: "E2E second seller product"
  });
  assert.equal(productB.status, 200);
  assert.equal(
    (
      await seller.request("POST", "/tconnect/product", {
        ...productInput,
        companyUuid: second.uuid
      })
    ).status,
    403
  );
  assert.equal(
    (await seller.request("PUT", `/tconnect/product/${productB.data.uuid}`, productInput)).status,
    404,
    "A seller cannot take over another product"
  );
  const catalog = await seller.request<Product[]>("GET", "/tconnect/product");
  assert.ok(catalog.data.every((item) => item.companyUuid === first.uuid));
  const publicCatalog = await anonymous.request<Product[]>(
    "GET",
    `/public/tconnect/product?companyUuid=${first.uuid}`
  );
  assert.equal(publicCatalog.status, 200, "Public catalog must validate its company query");
  assert.ok(publicCatalog.data.some((item) => item.uuid === productA.data.uuid));
  console.log(
    "PASS: profile/logo persistence, publication, product catalog and cross-company write rejection"
  );
  const inquiry = await anonymous.request<{ uuid: string }>("POST", "/public/tconnect/inquiry", {
    companyUuid: first.uuid,
    buyerName: "TConnect isolation buyer",
    email: `tconnect-buyer-${Date.now()}@example.invalid`,
    phone: "9000000000",
    requirement: "Test enquiry: 100 cotton T-shirts delivered to Tirupur.",
    quantity: "100 pieces",
    consent: true
  });
  assert.equal(inquiry.status, 200);
  const inboxA = await seller.request<Inquiry[]>("GET", "/tconnect/inquiry");
  const inboxB = await other.request<Inquiry[]>("GET", "/tconnect/inquiry");
  assert.ok(inboxA.data.some((item) => item.uuid === inquiry.data.uuid));
  assert.ok(inboxA.data.every((item) => item.companyUuid === first.uuid));
  assert.ok(!inboxB.data.some((item) => item.uuid === inquiry.data.uuid));
  assert.equal(
    (await other.request("PUT", `/tconnect/inquiry/${inquiry.data.uuid}`, { status: "closed" }))
      .status,
    404,
    "Another member cannot change this enquiry"
  );
  assert.equal(
    (await seller.request("PUT", `/tconnect/inquiry/${inquiry.data.uuid}`, { status: "closed" }))
      .status,
    200
  );
  console.log("PASS: private buyer enquiry inbox and status isolation");
  assert.equal(
    (
      await other.request("PUT", `/tconnect/member/${members[1]!.uuid}`, {
        membershipStatus: "approved",
        status: "active"
      })
    ).status,
    403,
    "A member cannot approve its own affiliation"
  );
  assert.equal(
    (
      await admin.request("PUT", `/tconnect/member/${members[1]!.uuid}`, {
        membershipStatus: "approved",
        status: "active"
      })
    ).status,
    200
  );
  const approved = await other.request<Company[]>("GET", "/tconnect/company");
  assert.equal(approved.data[0]?.associationUuid, associationUuid);
  companies[1] = approved.data[0]!;
  assert.equal(
    (
      await admin.request("PUT", `/tconnect/member/${members[1]!.uuid}`, {
        membershipStatus: "rejected",
        status: "inactive"
      })
    ).status,
    200
  );
  assert.equal(
    (await other.request("GET", "/tconnect/company")).status,
    403,
    "Suspension blocks an existing signed-in session"
  );
  assert.equal(
    (await seller.request("GET", "/tconnect/member/session")).status,
    200,
    "A separate seller session remains valid"
  );
  console.log("PASS: staff membership approval, account suspension and independent sessions");
} finally {
  for (const company of companies) {
    const { uuid, ...input } = company;
    await admin.request("PUT", `/tconnect/company/${uuid}`, {
      ...input,
      associationUuid: null,
      status: "inactive"
    });
  }
  for (const member of members)
    await admin.request("PUT", `/tconnect/member/${member.uuid}`, {
      membershipStatus: "rejected",
      status: "inactive"
    });
  console.log("Test company profiles and member accounts retained as inactive fixtures.");
}
