import assert from "node:assert/strict";
import {test} from "node:test";
import worker from "../../apps/tconnect/web/cloudflare/worker.mjs";
const env={CODEXSUN_TCONNECT_API_ORIGIN:"https://codexsun.com",CODEXSUN_TCONNECT_CORPORATE_ID:"TIRUPURCONNECT"};
test("Worker rejects mismatched tenant before public data or account writes",async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url)=>{calls.push(String(url));return Response.json({success:true,data:{corporateId:"CODEXSUN"}});};
 try{
  for(const [path,method] of [["company","GET"],["registration","POST"],["buyer/registration","POST"]]){
   const response=await worker.fetch(new Request(`https://tirupurconnect.com/api/platform/public/tconnect/${path}`,{method,headers:{Origin:"https://tirupurconnect.com","Content-Type":"application/json"},...(method==="POST"?{body:"{}"}:{})}),env);
   assert.equal(response.status,503);assert.equal((await response.json()).error.code,"TENANT_SETUP_PENDING");
  }
  assert(calls.every(url=>url.endsWith("/public/tconnect/registration")));
 }finally{globalThis.fetch=original;}
});
test("Worker forwards only allowed public requests without cookies or tenant headers",async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init});return String(url).endsWith("/public/tconnect/registration")?Response.json({success:true,data:{corporateId:"TIRUPURCONNECT"}}):Response.json({success:true,data:[]},{headers:{"Set-Cookie":"private=value"}});};
 try{
  const response=await worker.fetch(new Request("https://tirupurconnect.com/api/platform/public/tconnect/company",{headers:{Cookie:"private=secret",Authorization:"Bearer forged","x-tenant-id":"forged"}}),env);
  assert.equal(response.status,200);assert.equal(response.headers.get("set-cookie"),null);assert.equal(response.headers.get("cache-control"),"no-store");
  const outgoing=new Headers(calls[1].init.headers);assert.equal(outgoing.get("cookie"),null);assert.equal(outgoing.get("authorization"),null);assert.equal(outgoing.get("x-tenant-id"),null);
  assert.equal((await worker.fetch(new Request("https://tirupurconnect.com/api/platform/tconnect/quotation"),env)).status,404);
  assert.equal((await worker.fetch(new Request("https://tirupurconnect.com/api/platform/public/tconnect/registration",{method:"POST",headers:{Origin:"https://other.invalid"}}),env)).status,403);
 }finally{globalThis.fetch=original;}
});
test("Worker serves route metadata and redirects www without changing existing DNS",async()=>{
 const assets={fetch:async request=>new URL(request.url).pathname==="/contact/index.html"?new Response("<title>Contact Tirupur Connect</title>"):new Response("Missing",{status:404})};
 const page=await worker.fetch(new Request("https://tirupurconnect.com/contact"),{...env,ASSETS:assets});assert.equal(page.status,200);assert((await page.text()).includes("Contact Tirupur Connect"));
 const redirect=await worker.fetch(new Request("https://www.tirupurconnect.com/contact?q=test"),env);assert.equal(redirect.status,308);assert.equal(redirect.headers.get("location"),"https://tirupurconnect.com/contact?q=test");
});
