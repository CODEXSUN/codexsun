import assert from "node:assert/strict";
import {env} from "../../apps/platform/api/src/env.js";
import {TenantRepository} from "../../apps/platform/api/src/modules/tenant/tenant.repository.js";
import {getTenantDatabase,closeAllTenantDatabases} from "../../apps/platform/api/src/database/tenant-database.js";
import {getPlatformDatabase} from "../../apps/platform/api/src/database/platform-database.js";
import {migrateTconnect,seedTconnect} from "../../apps/tconnect/api/src/index.js";
import {TconnectTestSession as Session} from "./tconnect-test-session.js";
assert.equal(env.NODE_ENV,"development");
const tenant=await new TenantRepository().findByCorporateId(env.DEFAULT_TENANT_CORPORATE_ID);assert(tenant);assert.equal(tenant.dbName,"codexsun_db");assert(["localhost","127.0.0.1","::1"].includes(tenant.dbHost||env.DB_HOST));
try{const db=getTenantDatabase(tenant);await migrateTconnect(db as never);await seedTconnect(db as never);console.log("PASS registry-resolved local TConnect credential migration and permission seed");}finally{await closeAllTenantDatabases();await getPlatformDatabase().destroy();}
const admin=new Session();const anonymous=new Session();
await admin.login(env.DEFAULT_TENANT_ADMIN_EMAIL,env.DEFAULT_TENANT_ADMIN_PASSWORD);
const publicCompanies=await anonymous.request<any[]>("GET","/public/tconnect/company");assert.equal(publicCompanies.status,200);
const company=publicCompanies.data.find(row=>row.description.includes("fictional"));assert(company);
let uuid:string|undefined;
const base={companyUuid:company.uuid,kind:"certification",standardName:"Browser fixture review only",issuer:"Fixture authority (not a real certifier)",reference:`codexsun-front-review-${Date.now()}`,scope:"Fictional fixture evidence used to test publication and revocation.",publicEvidenceUrl:"https://example.invalid/fixture-evidence",expiresOn:"2099-12-31",privateNotes:"PRIVATE STAFF NOTE MUST NEVER APPEAR PUBLICLY",status:"pending",reviewConfirmed:false};
try{
 assert([400,401,403].includes((await anonymous.request("POST","/tconnect/credential",base)).status));
 const created=await admin.request<{uuid:string}>("POST","/tconnect/credential",base);assert.equal(created.status,200,"Staff credential permission must be available");uuid=created.data.uuid;
 let feed=await anonymous.request<any[]>("GET","/public/tconnect/credential");assert(!feed.data.some(row=>row.uuid===uuid));
 assert.equal((await admin.request("PUT",`/tconnect/credential/${uuid}`,{...base,status:"approved"})).status,400);
 assert.equal((await admin.request("PUT",`/tconnect/credential/${uuid}`,{...base,status:"approved",reviewConfirmed:true,expiresOn:"2020-01-01"})).status,400);
 assert.equal((await admin.request("PUT",`/tconnect/credential/${uuid}`,{...base,status:"approved",reviewConfirmed:true})).status,200);
 feed=await anonymous.request<any[]>("GET","/public/tconnect/credential");const visible=feed.data.find(row=>row.uuid===uuid);assert(visible);assert(!("privateNotes"in visible));assert(!("reviewedBy"in visible));assert(!("status"in visible));assert(visible.reviewedAt);
 assert.equal((await admin.request("PUT",`/tconnect/credential/${uuid}`,{...base,status:"revoked"})).status,200);feed=await anonymous.request<any[]>("GET","/public/tconnect/credential");assert(!feed.data.some(row=>row.uuid===uuid));
 const products=await anonymous.request<any[]>("GET","/public/tconnect/product/search?q=cotton");assert.equal(products.status,200);assert(products.data.length>0);assert(products.data.every(row=>row.status==="active"&&row.sellerName&&!('email'in row)));
 assert.equal((await anonymous.request("GET","/public/tconnect/product/search?q=x&tenant=forged")).status,400);
 console.log("PASS public product search, strict queries, pending/approved/revoked credential publication, evidence attestation, validity and private-note isolation");
}finally{if(uuid)await admin.request("PUT",`/tconnect/credential/${uuid}`,{...base,status:"revoked"});await admin.request("POST","/auth/logout",{desk:"tenant"});}
