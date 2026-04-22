# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storefront-order-flow.spec.ts >> customer can buy from product page, checkout, and track the order
- Location: tests\e2e\storefront-order-flow.spec.ts:229:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Add to cart' })
    - locator resolved to <button disabled type="button" data-slot="button" class="group/button inline-flex shrink-0 cursor-pointer items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-in…>…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    102 × waiting for element to be visible, enabled and stable
        - element is not enabled
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - link "Skip to main content" [ref=e4] [cursor=pointer]:
      - /url: "#storefront-main-content"
    - banner [ref=e5]:
      - generic [ref=e7]:
        - link "Codexsun Commerce Codexsun Commerce Suite-first commerce and operations software." [ref=e8] [cursor=pointer]:
          - /url: /
          - generic [ref=e9]:
            - img "Codexsun Commerce" [ref=e11]
            - generic [ref=e12]:
              - paragraph [ref=e13]: Codexsun Commerce
              - paragraph [ref=e14]: Suite-first commerce and operations software.
        - generic [ref=e17]:
          - generic [ref=e18]: Department
          - button "Department" [ref=e19] [cursor=pointer]:
            - generic [ref=e20]: All
            - img
          - textbox "Search for products, brands, and categories" [ref=e22]
          - button "Submit storefront search" [ref=e23] [cursor=pointer]:
            - img
        - generic [ref=e24]:
          - generic [ref=e25]:
            - link [ref=e26] [cursor=pointer]:
              - /url: /login
              - img
            - link [ref=e27] [cursor=pointer]:
              - /url: /cart
              - img
          - generic [ref=e28]:
            - button "Login" [ref=e29] [cursor=pointer]:
              - img
              - generic [ref=e30]: Login
              - img
            - button "More" [ref=e31] [cursor=pointer]:
              - generic [ref=e32]: More
              - img
            - button [ref=e33] [cursor=pointer]:
              - img
    - main [ref=e34]:
      - generic [ref=e35]:
        - generic [ref=e36]:
          - img "Aster Linen Shirt" [ref=e41]
          - generic [ref=e42]:
            - generic [ref=e44]:
              - generic [ref=e45]:
                - generic [ref=e46]:
                  - generic [ref=e47]: Core
                  - generic [ref=e48]: men
                - generic [ref=e49]:
                  - paragraph [ref=e50]: Aster Loom
                  - heading "Aster Linen Shirt" [level=1] [ref=e51]
                  - paragraph [ref=e52]: Aster Linen Shirt shared product master.
                - generic [ref=e54]:
                  - generic [ref=e55]: ₹1,890
                  - generic [ref=e56]: ₹2,230
              - generic [ref=e57]:
                - generic [ref=e58]:
                  - generic [ref=e59]: Quantity
                  - generic [ref=e60]:
                    - button [disabled]:
                      - img
                    - generic [ref=e61]: "1"
                    - button [disabled]:
                      - img
                - generic [ref=e62]:
                  - button "Add to cart" [disabled]:
                    - img
                    - text: Add to cart
                  - button "Buy now" [disabled]
                  - button "Save to wishlist" [ref=e63] [cursor=pointer]:
                    - img
                    - text: Save to wishlist
            - generic [ref=e66]:
              - button "See all specifications" [ref=e68] [cursor=pointer]:
                - img
                - text: See all specifications
              - generic [ref=e69]:
                - heading "Product identity Core catalog identifiers and merchandising placement." [level=3] [ref=e70]:
                  - button "Product identity Core catalog identifiers and merchandising placement." [expanded] [ref=e71] [cursor=pointer]:
                    - generic [ref=e72]:
                      - paragraph [ref=e73]: Product identity
                      - paragraph [ref=e74]: Core catalog identifiers and merchandising placement.
                    - img
                - region "Product identity Core catalog identifiers and merchandising placement." [ref=e75]:
                  - generic [ref=e77]:
                    - generic [ref=e78]:
                      - paragraph [ref=e79]: Brand
                      - paragraph [ref=e80]: Aster Loom
                    - generic [ref=e81]:
                      - paragraph [ref=e82]: Category
                      - paragraph [ref=e83]: Shirts
                    - generic [ref=e84]:
                      - paragraph [ref=e85]: Department
                      - paragraph [ref=e86]: men
                    - generic [ref=e87]:
                      - paragraph [ref=e88]: SKU
                      - paragraph [ref=e89]: ASTER-LINEN-SHIRT-001
                    - generic [ref=e90]:
                      - paragraph [ref=e91]: Product code
                      - paragraph [ref=e92]: CORE-PRD-001
                    - generic [ref=e93]:
                      - paragraph [ref=e94]: Type
                      - paragraph [ref=e95]: Finished Good
                    - generic [ref=e96]:
                      - paragraph [ref=e97]: Group
                      - paragraph [ref=e98]: Shared Catalog
              - heading "Merchandising Storefront-specific presentation and style notes." [level=3] [ref=e100]:
                - button "Merchandising Storefront-specific presentation and style notes." [ref=e101] [cursor=pointer]:
                  - generic [ref=e102]:
                    - paragraph [ref=e103]: Merchandising
                    - paragraph [ref=e104]: Storefront-specific presentation and style notes.
                  - img
              - heading "Pricing and fulfilment Commercial values and shipping notes." [level=3] [ref=e106]:
                - button "Pricing and fulfilment Commercial values and shipping notes." [ref=e107] [cursor=pointer]:
                  - generic [ref=e108]:
                    - paragraph [ref=e109]: Pricing and fulfilment
                    - paragraph [ref=e110]: Commercial values and shipping notes.
                  - img
            - generic [ref=e111]:
              - generic [ref=e113]:
                - img [ref=e114]
                - paragraph [ref=e119]: Shipping
                - paragraph [ref=e120]: Shared core seed product.
              - generic [ref=e122]:
                - img [ref=e123]
                - paragraph [ref=e126]: Purchase
                - paragraph [ref=e127]: Stock validation continues during purchase flow and order processing.
        - generic [ref=e129]:
          - generic [ref=e130]:
            - paragraph [ref=e131]: Related
            - heading "You may also like" [level=2] [ref=e132]
          - link "Back to catalog" [ref=e133] [cursor=pointer]:
            - /url: /catalog
    - contentinfo [ref=e135]:
      - generic [ref=e137]:
        - generic [ref=e138]:
          - link "Codexsun Commerce Codexsun Commerce Suite-first commerce and operations software." [ref=e139] [cursor=pointer]:
            - /url: /
            - img "Codexsun Commerce" [ref=e141]
            - generic [ref=e142]:
              - paragraph [ref=e143]: Codexsun Commerce
              - paragraph [ref=e144]: Suite-first commerce and operations software.
          - paragraph [ref=e146]: A premium storefront built on shared core masters, with ecommerce-owned cart, checkout, tracking, and customer portal flows.
          - generic [ref=e147]:
            - generic [ref=e148]:
              - img [ref=e149]
              - generic [ref=e152]: 18 North Residency, Cathedral Road, Nungambakkam
            - generic [ref=e153]:
              - img [ref=e154]
              - link "+91 90000 12345" [ref=e156] [cursor=pointer]:
                - /url: tel:919000012345
            - generic [ref=e157]:
              - img [ref=e158]
              - link "storefront@codexsun.local" [ref=e161] [cursor=pointer]:
                - /url: mailto:storefront@codexsun.local
        - generic [ref=e162]:
          - heading "Top categories" [level=3] [ref=e163]
          - list [ref=e164]:
            - listitem [ref=e165]:
              - link "Men's Knitwear" [ref=e166] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e167]:
              - link "Women's Knitwear" [ref=e168] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e169]:
              - link "Kids and Infantwear" [ref=e170] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e171]:
              - link "Inner Wears" [ref=e172] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e173]:
              - link "Corporate and Festival Tees" [ref=e174] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e175]:
              - link "View All Categories" [ref=e176] [cursor=pointer]:
                - /url: /catalog
        - generic [ref=e177]:
          - heading "Order support" [level=3] [ref=e178]
          - list [ref=e179]:
            - listitem [ref=e180]:
              - link "Track Factory Dispatch" [ref=e181] [cursor=pointer]:
                - /url: /track-order
            - listitem [ref=e182]:
              - link "Bulk Order Enquiry" [ref=e183] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e184]:
              - link "Sampling and Sourcing" [ref=e185] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e186]:
              - link "Size and Fit Assistance" [ref=e187] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e188]:
              - link "Contact Textile Desk" [ref=e189] [cursor=pointer]:
                - /url: /profile
        - generic [ref=e190]:
          - heading "About the brand" [level=3] [ref=e191]
          - list [ref=e192]:
            - listitem [ref=e193]:
              - link "Tiruppur Story" [ref=e194] [cursor=pointer]:
                - /url: /
            - listitem [ref=e195]:
              - link "Factory-Direct Promise" [ref=e196] [cursor=pointer]:
                - /url: /
            - listitem [ref=e197]:
              - link "Private Label Support" [ref=e198] [cursor=pointer]:
                - /url: /
            - listitem [ref=e199]:
              - link "Retail and Wholesale Supply" [ref=e200] [cursor=pointer]:
                - /url: /
            - listitem [ref=e201]:
              - link "Join as Buying Partner" [ref=e202] [cursor=pointer]:
                - /url: /
        - generic [ref=e203]:
          - heading "Trade information" [level=3] [ref=e204]
          - list [ref=e205]:
            - listitem [ref=e206]:
              - link "Terms & Conditions" [ref=e207] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e208]:
              - link "Privacy Policy" [ref=e209] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e210]:
              - link "Shipping Information" [ref=e211] [cursor=pointer]:
                - /url: /shipping
            - listitem [ref=e212]:
              - link "Returns & Exchanges" [ref=e213] [cursor=pointer]:
                - /url: /returns
            - listitem [ref=e214]:
              - link "Contact and Support" [ref=e215] [cursor=pointer]:
                - /url: /contact
      - generic [ref=e217]:
        - link "Instagram" [ref=e219] [cursor=pointer]:
          - /url: https://instagram.com/codexsun
          - img [ref=e220]
          - generic [ref=e222]: Instagram
        - generic [ref=e223]: All rights reserved.
    - button "Open contact actions" [ref=e225] [cursor=pointer]:
      - img [ref=e226]
```

# Test source

```ts
  143 |             emailType: String(entry.emailType ?? "primary"),
  144 |             isPrimary: Boolean(entry.isPrimary),
  145 |           }))
  146 |         : [{ email: String(profile.email), emailType: "primary", isPrimary: true }],
  147 |       phones: Array.isArray(profile.phones) && profile.phones.length > 0
  148 |         ? profile.phones.map((entry: Record<string, unknown>) => ({
  149 |             phoneNumber: String(entry.phoneNumber ?? profile.phoneNumber),
  150 |             phoneType: String(entry.phoneType ?? "primary"),
  151 |             isPrimary: Boolean(entry.isPrimary),
  152 |           }))
  153 |         : [{ phoneNumber: String(profile.phoneNumber), phoneType: "primary", isPrimary: true }],
  154 |       bankAccounts: Array.isArray(profile.bankAccounts) ? profile.bankAccounts : [],
  155 |       gstDetails: Array.isArray(profile.gstDetails) ? profile.gstDetails : [],
  156 |     }
  157 | 
  158 |     await requestJson("/api/v1/storefront/customers/me", {
  159 |       method: "PATCH",
  160 |       body: JSON.stringify(nextPayload),
  161 |     })
  162 |   })
  163 | 
  164 |   await page.reload()
  165 |   await expect(page.getByRole("heading", { name: "Delivery, payment, and final review." })).toBeVisible()
  166 |   await expect(savedAddressOptions.first()).toBeVisible()
  167 |   await savedAddressOptions.first().click()
  168 | }
  169 | 
  170 | async function chooseLookupOption(
  171 |   scope: import("@playwright/test").Locator,
  172 |   fieldLabel: string,
  173 |   optionName: string | RegExp
  174 | ) {
  175 |   const field = scope.getByText(fieldLabel, { exact: true }).locator("xpath=..")
  176 |   const triggerButton = field.getByRole("button").first()
  177 | 
  178 |   if (typeof optionName === "string" && (await triggerButton.textContent())?.trim() === optionName) {
  179 |     return
  180 |   }
  181 | 
  182 |   await triggerButton.click()
  183 | 
  184 |   const optionButton = scope.getByRole("button", { name: optionName }).last()
  185 |   if (await optionButton.count()) {
  186 |     await optionButton.click()
  187 |     return
  188 |   }
  189 | 
  190 |   const searchInput = scope.getByPlaceholder(new RegExp(`Search ${fieldLabel}`, "i"))
  191 |   await searchInput.fill(typeof optionName === "string" ? optionName : "")
  192 |   await scope.getByRole("button", { name: optionName }).last().click()
  193 | }
  194 | 
  195 | async function continueFromCartToCheckout(page: import("@playwright/test").Page) {
  196 |   await page.goto("/checkout")
  197 | 
  198 |   const checkoutHeading = page.getByRole("heading", {
  199 |     name: "Delivery, payment, and final review.",
  200 |   })
  201 |   const checkoutAccessHeading = page.getByRole("heading", {
  202 |     name: "Sign in before checkout.",
  203 |   })
  204 |   const loginHeading = page.getByRole("heading", { name: "Welcome" })
  205 | 
  206 |   await Promise.race([
  207 |     checkoutHeading.waitFor({ state: "visible", timeout: 10000 }),
  208 |     checkoutAccessHeading.waitFor({ state: "visible", timeout: 10000 }),
  209 |     loginHeading.waitFor({ state: "visible", timeout: 10000 }),
  210 |   ])
  211 | 
  212 |   if (await checkoutAccessHeading.isVisible()) {
  213 |     await page.getByRole("button", { name: "Existing customer" }).click()
  214 |   }
  215 | 
  216 |   if (await loginHeading.isVisible()) {
  217 |     await page.getByLabel("Email").fill("customer@codexsun.local")
  218 |     await page.getByLabel("Password").fill("Customer@12345")
  219 |     await page.getByRole("button", { name: "Login" }).click()
  220 |     await page.waitForURL(/\/(customer|checkout)$/)
  221 |     if (!/\/checkout$/.test(page.url())) {
  222 |       await page.goto("/checkout")
  223 |     }
  224 |   }
  225 | 
  226 |   await expect(checkoutHeading).toBeVisible()
  227 | }
  228 | 
  229 | test("customer can buy from product page, checkout, and track the order", async ({
  230 |   page,
  231 | }) => {
  232 |   await page.goto("/")
  233 |   await page.evaluate(() => {
  234 |     window.localStorage.removeItem("codexsun.storefront.cart")
  235 |   })
  236 | 
  237 |   await page.goto("/products/aster-linen-shirt")
  238 | 
  239 |   await expect(
  240 |     page.getByRole("heading", { name: "Aster Linen Shirt" })
  241 |   ).toBeVisible()
  242 | 
> 243 |   await page.getByRole("button", { name: "Add to cart" }).click()
      |                                                           ^ Error: locator.click: Test timeout of 60000ms exceeded.
  244 |   await page.goto("/cart")
  245 | 
  246 |   await expect(
  247 |     page.getByRole("link", { name: "Aster Linen Shirt" })
  248 |   ).toBeVisible()
  249 | 
  250 |   await continueFromCartToCheckout(page)
  251 | 
  252 |   await ensureCheckoutAddress(page)
  253 | 
  254 |   const contactEmail = page.getByLabel("Contact email")
  255 |   await contactEmail.fill("customer@codexsun.local")
  256 |   await expect(contactEmail).toHaveValue(/customer@codexsun\.local/)
  257 | 
  258 |   await page.getByRole("button", { name: "Continue to pay" }).click()
  259 |   await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  260 | 
  261 |   const orderNumberText = await page.getByText(/ECM-\d{8}-\d{4}/).textContent()
  262 |   const orderNumberMatch = orderNumberText?.match(/(ECM-\d{8}-\d{4})/)
  263 |   expect(orderNumberMatch).not.toBeNull()
  264 |   const orderNumber = orderNumberMatch![1]
  265 | 
  266 |   await page.getByRole("link", { name: "Open order page" }).click()
  267 |   await page.waitForURL(/\/(customer\/orders\/|track-order)/)
  268 |   if (/\/customer\/orders\//.test(page.url())) {
  269 |     await expect(page.getByText("Order overview")).toBeVisible()
  270 |     await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible()
  271 |   } else {
  272 |     await expect(page.getByRole("heading", { name: "Track your order" })).toBeVisible()
  273 |     await expect(page.getByText(orderNumber)).toBeVisible()
  274 |   }
  275 | 
  276 |   await page.goto(
  277 |     `/track-order?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent("customer@codexsun.local")}`
  278 |   )
  279 | 
  280 |   await expect(page.getByRole("heading", { name: "Track your order" })).toBeVisible()
  281 |   await expect(page.getByText(orderNumber)).toBeVisible()
  282 |   await expect(page.getByText("Payment Paid")).toBeVisible()
  283 |   await expect(page.getByText("Total paid")).toBeVisible()
  284 |   await expect(page.getByText("Timeline", { exact: true })).toBeVisible()
  285 |   await expect(page.getByText("Payment captured")).toBeVisible()
  286 |   await expect(page.getByText("Order paid")).toBeVisible()
  287 | })
  288 | 
```