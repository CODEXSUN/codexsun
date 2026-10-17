import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {BrowserPage} from "./tconnect-negotiation-browser.mjs";
const origin="https://tirupurconnect.com";
const directory=resolve(`dist/.cache/tconnect-frontend-live-${Date.now()}`);
await mkdir(directory,{recursive:true});
const browser=spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",["--headless","--disable-gpu","--no-first-run","--no-default-browser-check",`--user-data-dir=${directory}`,"--remote-debugging-port=0","about:blank"],{windowsHide:true,stdio:"ignore"});
let control;let page;
try{
 let port;for(let attempt=0;attempt<100;attempt++){try{port=Number((await readFile(`${directory}/DevToolsActivePort`,"utf8")).split("\n")[0]);}catch{}if(port)break;await new Promise(done=>setTimeout(done,100));}assert(port);
 control=await BrowserPage.connect((await(await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl);
 const {targetId}=await control.send("Target.createTarget",{url:origin});
 const target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(row=>row.id===targetId);
 page=await BrowserPage.connect(target.webSocketDebuggerUrl);await page.send("Page.enable");
 for(const width of [1440,768,390,320]){
  await page.send("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:width<500});
  for(const path of ["/","/categories","/standards","/join","/login","/register","/register/buyer","/contact"]){
   await page.send("Page.navigate",{url:origin+path});
   await page.waitFor(`location.pathname===${JSON.stringify(path)}&&document.querySelector('.tc-footer')!==null&&document.readyState==='complete'`,"live public page");
   assert(await page.evaluate("document.documentElement.scrollWidth<=innerWidth"),`${path} overflow at ${width}`);
   assert.equal(await page.evaluate("document.querySelectorAll('h1').length"),1,`${path} needs one heading`);
   if(path==="/"){
    await page.waitFor("document.querySelector('.tc-hero-photo')?.complete&&document.querySelector('.tc-hero-photo')?.naturalWidth>0","live hero image");
    if(width===390||width===1440)await page.screenshot(resolve(`dist/tconnect-live-frontend-${width}.png`));
   }
   if(path==="/login"){
    const links=await page.evaluate("[...document.querySelectorAll('a[href^=\"https://codexsun.com/login\"]')].map(item=>item.href)");
    assert(links.length>=2);assert(links.every(href=>new URL(href).searchParams.get('corporateId')==='TIRUPURCONNECT'));
   }
   if(path.startsWith('/register')){
    await page.waitFor("document.body.innerText.includes('New connections are coming soon.')","tenant setup pending state");
    assert.equal(await page.evaluate("document.querySelectorAll('form').length"),0,"Wrong-tenant account creation must stay unavailable");
   }
  }
  console.info(`LIVE FRONTEND PASS: ${width}px public layouts, loaded imagery, dedicated tenant login links and guarded registration.`);
 }
 const contact=await(await fetch(origin+"/contact")).text();assert(contact.includes('<title>Contact Tirupur Connect | Tirupur Connect</title>'));
 console.info("LIVE FRONTEND PASS: route-specific metadata. No accounts or backend records changed.");
}finally{
 if(control)await control.send("Browser.close").catch(()=>{});
 page?.socket.close();control?.socket.close();browser.kill();
}
