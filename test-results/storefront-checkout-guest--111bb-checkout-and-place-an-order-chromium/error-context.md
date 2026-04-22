# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storefront-checkout.spec.ts >> guest can continue from cart to checkout and place an order
- Location: tests\e2e\storefront-checkout.spec.ts:340:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Order confirmed/ })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: /Order confirmed/ })

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
            - link "1" [ref=e27] [cursor=pointer]:
              - /url: /cart
              - img
              - generic [ref=e28]: "1"
          - generic [ref=e29]:
            - button "Login" [ref=e30] [cursor=pointer]:
              - img
              - generic [ref=e31]: Login
              - img
            - button "More" [ref=e32] [cursor=pointer]:
              - generic [ref=e33]: More
              - img
            - button [ref=e34] [cursor=pointer]:
              - img
    - main [ref=e35]:
      - generic [ref=e37]:
        - generic [ref=e38]:
          - paragraph [ref=e39]: Checkout
          - heading "Delivery, payment, and final review." [level=1] [ref=e40]
          - paragraph [ref=e41]: "The checkout now follows the same softer storefront language as the cart: cleaner spacing, warmer borders, and a calmer order summary that stays visible while you finish the order."
        - alert [ref=e42]:
          - generic [ref=e43]: Checkout needs attention
          - paragraph [ref=e45]: Requested quantity is not available for checkout.
        - generic [ref=e46]:
          - generic [ref=e47]:
            - generic [ref=e49]:
              - generic [ref=e50]:
                - generic [ref=e51]:
                  - generic [ref=e52]:
                    - img [ref=e53]
                    - heading "Delivery address" [level=2] [ref=e56]
                  - generic [ref=e57]:
                    - paragraph [ref=e58]: Saved delivery addresses
                    - paragraph [ref=e59]: Select the address for this shipment or add a fresh delivery location.
                - button "Add new address" [ref=e60] [cursor=pointer]:
                  - img
                  - text: Add new address
              - radiogroup [ref=e61]:
                - generic [ref=e62] [cursor=pointer]:
                  - radio "Home Default Guest +919876543210 45 Test Street Chennai, Chennai, Tamil Nadu, India 600001" [checked] [ref=e63]
                  - radio [checked] [ref=e66]
                  - generic [ref=e67]:
                    - generic [ref=e68]:
                      - generic [ref=e69]: Home
                      - generic [ref=e70]: Default
                    - generic [ref=e71]:
                      - paragraph [ref=e72]: Guest
                      - paragraph [ref=e73]: "+919876543210"
                      - paragraph [ref=e74]: 45 Test Street
                      - paragraph [ref=e75]: Chennai, Chennai, Tamil Nadu, India 600001
                  - img [ref=e77]
              - generic [ref=e80]:
                - generic [ref=e81]:
                  - generic [ref=e82]: Contact email
                  - textbox "Contact email" [ref=e83]: guest.checkout@codexsun.local
                - generic [ref=e84]:
                  - generic [ref=e85]: Order note
                  - textbox "Order note" [ref=e86]
            - generic [ref=e88]:
              - generic [ref=e89]:
                - generic [ref=e90]:
                  - img [ref=e91]
                  - heading "Delivery preference" [level=2] [ref=e96]
                - paragraph [ref=e97]: Choose how fast the order should arrive and how the package should be handled.
              - radiogroup [ref=e98]:
                - generic [ref=e99] [cursor=pointer]:
                  - 'radio "Standard delivery Balanced dispatch window for the regular storefront flow. SLA: Dispatch within 24 hours Courier: Delhivery Surface ETA: 4-6 days COD eligible" [checked] [ref=e100]'
                  - radio [checked] [ref=e103]
                  - generic [ref=e104]:
                    - generic [ref=e105]: Standard delivery
                    - generic [ref=e106]: "Balanced dispatch window for the regular storefront flow. SLA: Dispatch within 24 hours Courier: Delhivery Surface ETA: 4-6 days COD eligible"
                - generic [ref=e107] [cursor=pointer]:
                  - 'radio "Priority delivery Faster delivery preference for urgent orders. SLA: Priority packing within 12 hours Courier: Blue Dart Express ETA: 2-3 days COD eligible" [ref=e108]'
                  - radio [ref=e109]
                  - generic [ref=e110]:
                    - generic [ref=e111]: Priority delivery
                    - generic [ref=e112]: "Faster delivery preference for urgent orders. SLA: Priority packing within 12 hours Courier: Blue Dart Express ETA: 2-3 days COD eligible"
                - generic [ref=e113] [cursor=pointer]:
                  - 'radio "Signature packaging Occasion-ready packaging preference with a premium handoff. SLA: Premium handoff with presentation wrap Courier: Blue Dart Secure ETA: 3-5 days Prepaid only" [ref=e114]'
                  - radio [ref=e115]
                  - generic [ref=e116]:
                    - generic [ref=e117]: Signature packaging
                    - generic [ref=e118]: "Occasion-ready packaging preference with a premium handoff. SLA: Premium handoff with presentation wrap Courier: Blue Dart Secure ETA: 3-5 days Prepaid only"
                - generic [ref=e119] [cursor=pointer]:
                  - radio "Store pickup Reserve the order and collect it from the configured retail pickup location. Prepaid only" [ref=e120]
                  - radio [ref=e121]
                  - generic [ref=e122]:
                    - generic [ref=e123]: Store pickup
                    - generic [ref=e124]: Reserve the order and collect it from the configured retail pickup location. Prepaid only
            - generic [ref=e126]:
              - generic [ref=e127]:
                - generic [ref=e128]:
                  - img [ref=e129]
                  - heading "Payment method" [level=2] [ref=e131]
                - paragraph [ref=e132]: Choose how the payment should open once the order details are ready.
              - radiogroup [ref=e133]:
                - generic [ref=e134] [cursor=pointer]:
                  - radio "UPI / Wallet Opens Razorpay Checkout with UPI and wallet payment methods." [checked] [ref=e135]
                  - radio [checked] [ref=e138]
                  - generic [ref=e139]:
                    - generic [ref=e140]: UPI / Wallet
                    - generic [ref=e141]: Opens Razorpay Checkout with UPI and wallet payment methods.
                - generic [ref=e142] [cursor=pointer]:
                  - radio "Credit or debit card Opens Razorpay Checkout and completes payment before confirmation." [ref=e143]
                  - radio [ref=e144]
                  - generic [ref=e145]:
                    - generic [ref=e146]: Credit or debit card
                    - generic [ref=e147]: Opens Razorpay Checkout and completes payment before confirmation.
                - generic [ref=e148]:
                  - radio "Cash on delivery (Coming soon) COD is eligible for Metro South once offline delivery collection is activated." [disabled] [ref=e149]
                  - radio [disabled] [ref=e150]
                  - generic [ref=e151]:
                    - generic [ref=e152]: Cash on delivery (Coming soon)
                    - generic [ref=e153]: COD is eligible for Metro South once offline delivery collection is activated.
            - generic [ref=e155]:
              - generic [ref=e156]:
                - heading "Coupon code" [level=2] [ref=e157]
                - paragraph [ref=e158]: Enter one customer coupon code exactly as shown in your portal. Validation happens when the order is created.
              - generic [ref=e159]:
                - generic [ref=e160]: Coupon code
                - textbox "Coupon code" [disabled]:
                  - /placeholder: Sign in to use customer coupons
              - paragraph [ref=e161]: Guest checkout can continue without a coupon, but customer coupon validation requires a signed-in account.
          - complementary [ref=e162]:
            - generic [ref=e164]:
              - generic [ref=e165]:
                - heading "Order summary" [level=2] [ref=e166]
                - paragraph [ref=e167]: A quick view of the garments in this order, delivery charges, and the final payable total.
              - generic [ref=e169]:
                - img "Aster Linen Shirt" [ref=e172]
                - generic [ref=e173]:
                  - paragraph [ref=e174]: Aster Linen Shirt
                  - paragraph [ref=e175]: Selected style / Qty 1
                  - generic [ref=e177]: ₹1,890
              - generic [ref=e178]: You are saving ₹340 on this order.
              - generic [ref=e179]:
                - generic [ref=e180]:
                  - generic [ref=e181]: Subtotal
                  - generic [ref=e184]: ₹1,890
                - generic [ref=e185]:
                  - generic [ref=e186]: Shipping
                  - generic [ref=e189]: ₹149
                - generic [ref=e190]:
                  - paragraph [ref=e191]: Standard delivery
                  - paragraph [ref=e192]: Dispatch within 24 hours via Delhivery Surface. ETA 4-6 days.
                  - paragraph [ref=e193]: Zone Metro South · COD eligible
                - generic [ref=e194]:
                  - generic [ref=e195]: Handling
                  - generic [ref=e198]: ₹99
                - generic [ref=e199]:
                  - generic [ref=e200]: Payment
                  - generic [ref=e201]: Razorpay Checkout
                - generic [ref=e202]:
                  - generic [ref=e203]: Total
                  - generic [ref=e206]: ₹2,138
              - button "Continue to pay" [ref=e207] [cursor=pointer]
              - generic [ref=e208]:
                - generic [ref=e209]:
                  - img [ref=e210]
                  - generic [ref=e215]:
                    - paragraph [ref=e216]: Delivery preview
                    - paragraph [ref=e217]: Standard delivery stays attached to this checkout so the order can carry the delivery preference into fulfillment.
                - generic [ref=e218]:
                  - img [ref=e219]
                  - generic [ref=e222]:
                    - paragraph [ref=e223]: Secure checkout
                    - paragraph [ref=e224]: Address confirmation, payment, and order verification stay inside the secure storefront payment flow.
                - generic [ref=e225]:
                  - img [ref=e226]
                  - generic [ref=e229]:
                    - paragraph [ref=e230]: Storefront matched
                    - paragraph [ref=e231]: Borders, spacing, and the summary surface now follow the same warm storefront composition as the cart page.
    - contentinfo [ref=e233]:
      - generic [ref=e235]:
        - generic [ref=e236]:
          - link "Codexsun Commerce Codexsun Commerce Suite-first commerce and operations software." [ref=e237] [cursor=pointer]:
            - /url: /
            - img "Codexsun Commerce" [ref=e239]
            - generic [ref=e240]:
              - paragraph [ref=e241]: Codexsun Commerce
              - paragraph [ref=e242]: Suite-first commerce and operations software.
          - paragraph [ref=e244]: A premium storefront built on shared core masters, with ecommerce-owned cart, checkout, tracking, and customer portal flows.
          - generic [ref=e245]:
            - generic [ref=e246]:
              - img [ref=e247]
              - generic [ref=e250]: 18 North Residency, Cathedral Road, Nungambakkam
            - generic [ref=e251]:
              - img [ref=e252]
              - link "+91 90000 12345" [ref=e254] [cursor=pointer]:
                - /url: tel:919000012345
            - generic [ref=e255]:
              - img [ref=e256]
              - link "storefront@codexsun.local" [ref=e259] [cursor=pointer]:
                - /url: mailto:storefront@codexsun.local
        - generic [ref=e260]:
          - heading "Top categories" [level=3] [ref=e261]
          - list [ref=e262]:
            - listitem [ref=e263]:
              - link "Men's Knitwear" [ref=e264] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e265]:
              - link "Women's Knitwear" [ref=e266] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e267]:
              - link "Kids and Infantwear" [ref=e268] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e269]:
              - link "Inner Wears" [ref=e270] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e271]:
              - link "Corporate and Festival Tees" [ref=e272] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e273]:
              - link "View All Categories" [ref=e274] [cursor=pointer]:
                - /url: /catalog
        - generic [ref=e275]:
          - heading "Order support" [level=3] [ref=e276]
          - list [ref=e277]:
            - listitem [ref=e278]:
              - link "Track Factory Dispatch" [ref=e279] [cursor=pointer]:
                - /url: /track-order
            - listitem [ref=e280]:
              - link "Bulk Order Enquiry" [ref=e281] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e282]:
              - link "Sampling and Sourcing" [ref=e283] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e284]:
              - link "Size and Fit Assistance" [ref=e285] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e286]:
              - link "Contact Textile Desk" [ref=e287] [cursor=pointer]:
                - /url: /profile
        - generic [ref=e288]:
          - heading "About the brand" [level=3] [ref=e289]
          - list [ref=e290]:
            - listitem [ref=e291]:
              - link "Tiruppur Story" [ref=e292] [cursor=pointer]:
                - /url: /
            - listitem [ref=e293]:
              - link "Factory-Direct Promise" [ref=e294] [cursor=pointer]:
                - /url: /
            - listitem [ref=e295]:
              - link "Private Label Support" [ref=e296] [cursor=pointer]:
                - /url: /
            - listitem [ref=e297]:
              - link "Retail and Wholesale Supply" [ref=e298] [cursor=pointer]:
                - /url: /
            - listitem [ref=e299]:
              - link "Join as Buying Partner" [ref=e300] [cursor=pointer]:
                - /url: /
        - generic [ref=e301]:
          - heading "Trade information" [level=3] [ref=e302]
          - list [ref=e303]:
            - listitem [ref=e304]:
              - link "Terms & Conditions" [ref=e305] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e306]:
              - link "Privacy Policy" [ref=e307] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e308]:
              - link "Shipping Information" [ref=e309] [cursor=pointer]:
                - /url: /shipping
            - listitem [ref=e310]:
              - link "Returns & Exchanges" [ref=e311] [cursor=pointer]:
                - /url: /returns
            - listitem [ref=e312]:
              - link "Contact and Support" [ref=e313] [cursor=pointer]:
                - /url: /contact
      - generic [ref=e315]:
        - link "Instagram" [ref=e317] [cursor=pointer]:
          - /url: https://instagram.com/codexsun
          - img [ref=e318]
          - generic [ref=e320]: Instagram
        - generic [ref=e321]: All rights reserved.
    - button "Open contact actions" [ref=e323] [cursor=pointer]:
      - img [ref=e324]
```

# Test source

```ts
  246 |         checkoutImage: null,
  247 |         themeColor: "#1f2937",
  248 |       },
  249 |     },
  250 |     verifiedOrderResponse: {
  251 |       item: {
  252 |         ...order,
  253 |         status: "paid",
  254 |         paymentStatus: "paid",
  255 |         providerPaymentId: "pay_live_success_001",
  256 |         timeline: [
  257 |           ...order.timeline,
  258 |           {
  259 |             id: "timeline:live-paid",
  260 |             code: "payment_captured",
  261 |             label: "Payment captured",
  262 |             summary: "Razorpay payment was verified successfully.",
  263 |             createdAt: "2026-04-07T12:01:00.000Z",
  264 |           },
  265 |           {
  266 |             id: "timeline:live-confirmed",
  267 |             code: "order_paid",
  268 |             label: "Order paid",
  269 |             summary: "The order is paid and waiting to enter fulfillment operations.",
  270 |             createdAt: "2026-04-07T12:01:00.000Z",
  271 |           },
  272 |         ],
  273 |         updatedAt: "2026-04-07T12:01:00.000Z",
  274 |       },
  275 |     },
  276 |   }
  277 | }
  278 | 
  279 | test("checkout matches the storefront flow and exposes the add-address dialog", async ({
  280 |   page,
  281 | }) => {
  282 |   await login(page, "customer@codexsun.local", "Customer@12345")
  283 | 
  284 |   await expect(page).toHaveURL(/\/customer$/)
  285 | 
  286 |   await page.evaluate(() => {
  287 |     window.localStorage.setItem(
  288 |       "codexsun.storefront.cart",
  289 |       JSON.stringify([
  290 |         {
  291 |           productId: "core-product:aster-linen-shirt",
  292 |           slug: "aster-linen-shirt",
  293 |           name: "Aster Linen Shirt",
  294 |           imageUrl: null,
  295 |           quantity: 1,
  296 |           unitPrice: 1890,
  297 |           mrp: 2230,
  298 |         },
  299 |       ])
  300 |     )
  301 |   })
  302 | 
  303 |   await page.goto("/checkout")
  304 | 
  305 |   await expect(
  306 |     page.getByRole("heading", { name: "Delivery, payment, and final review." })
  307 |   ).toBeVisible()
  308 |   await expect(page.getByRole("heading", { name: "Delivery address" })).toBeVisible()
  309 |   await expect(page.getByRole("heading", { name: "Delivery preference" })).toBeVisible()
  310 |   await expect(page.getByRole("heading", { name: "Payment method" })).toBeVisible()
  311 |   await expect(page.getByRole("heading", { name: "Order summary" })).toBeVisible()
  312 | 
  313 |   await page.getByRole("button", { name: "Add new address" }).click()
  314 | 
  315 |   await expect(page.getByRole("heading", { name: "Add delivery address" })).toBeVisible()
  316 |   await expect(page.getByLabel("Address label")).toBeVisible()
  317 |   await expect(page.getByLabel("Phone")).toBeVisible()
  318 |   await expect(page.getByText("Country", { exact: true })).toBeVisible()
  319 |   await expect(page.getByText("State", { exact: true })).toBeVisible()
  320 |   await expect(page.getByText("District", { exact: true })).toBeVisible()
  321 |   await expect(page.getByText("City", { exact: true })).toBeVisible()
  322 |   await expect(page.getByText("Postal code", { exact: true })).toBeVisible()
  323 |   await expect(page.getByText("Set as default delivery address")).toBeVisible()
  324 |   const dialog = page.getByRole("dialog")
  325 |   await saveAddressFromDialog(dialog, {
  326 |     label: "Home",
  327 |     phone: "+919876543210",
  328 |     firstName: "Customer",
  329 |     line1: "45 Test Street",
  330 |   })
  331 | 
  332 |   await page.getByRole("button", { name: "Continue to pay" }).click()
  333 |   await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  334 |   await expect(page.getByText(/ECM-\d{8}-\d{4}/)).toBeVisible()
  335 |   await page.getByRole("link", { name: "Open order page" }).click()
  336 |   await expect(page).toHaveURL(/\/customer\/orders\//)
  337 |   await expect(page.getByText("Order overview")).toBeVisible()
  338 | })
  339 | 
  340 | test("guest can continue from cart to checkout and place an order", async ({
  341 |   page,
  342 | }) => {
  343 |   await prepareGuestCheckout(page)
  344 |   await page.getByRole("button", { name: "Continue to pay" }).click()
  345 | 
> 346 |   await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  347 |   const orderNumberText = await page.getByText(/ECM-\d{8}-\d{4}/).textContent()
  348 |   const orderNumberMatch = orderNumberText?.match(/(ECM-\d{8}-\d{4})/)
  349 |   expect(orderNumberMatch).not.toBeNull()
  350 |   const orderNumber = orderNumberMatch![1]
  351 | 
  352 |   await page.getByRole("link", { name: "Open order page" }).click()
  353 |   await expect(page).toHaveURL(/\/track-order\?/)
  354 |   await expect(page.getByRole("heading", { name: "Track your order" })).toBeVisible()
  355 |   await expect(page.getByText(orderNumber)).toBeVisible()
  356 |   await expect(page.getByText("Payment Paid")).toBeVisible()
  357 | })
  358 | 
  359 | test("live checkout can reopen the same payment after modal close without creating a duplicate order", async ({
  360 |   page,
  361 | }) => {
  362 |   const fixtures = createLiveCheckoutFixtures()
  363 |   let checkoutCreateCount = 0
  364 |   let paymentVerifyCount = 0
  365 | 
  366 |   await mockLiveRazorpay(page, ["dismiss", "success"])
  367 | 
  368 |   await page.route("**/api/v1/storefront/checkout/payment/verify", async (route) => {
  369 |     paymentVerifyCount += 1
  370 |     await route.fulfill({
  371 |       status: 200,
  372 |       contentType: "application/json",
  373 |       body: JSON.stringify(fixtures.verifiedOrderResponse),
  374 |     })
  375 |   })
  376 | 
  377 |   await page.route("**/api/v1/storefront/checkout", async (route) => {
  378 |     checkoutCreateCount += 1
  379 |     await route.fulfill({
  380 |       status: 201,
  381 |       contentType: "application/json",
  382 |       body: JSON.stringify(fixtures.checkoutResponse),
  383 |     })
  384 |   })
  385 | 
  386 |   await prepareGuestCheckout(page)
  387 |   await page.getByRole("button", { name: "Continue to pay" }).click()
  388 | 
  389 |   await expect(page.getByText("Razorpay checkout was closed before payment completed.")).toBeVisible()
  390 |   await expect(page.getByRole("button", { name: "Reopen payment" })).toBeVisible()
  391 |   await expect(page.getByRole("button", { name: "Retry payment" })).toBeVisible()
  392 | 
  393 |   await page.getByRole("button", { name: "Reopen payment" }).click()
  394 | 
  395 |   await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  396 |   expect(checkoutCreateCount).toBe(1)
  397 |   expect(paymentVerifyCount).toBe(1)
  398 |   await expect.poll(() => page.evaluate(() => (window as Window & { __razorpayOpenCount?: number }).__razorpayOpenCount ?? 0)).toBe(2)
  399 | })
  400 | 
  401 | test("live checkout can retry the same payment session after verification failure", async ({
  402 |   page,
  403 | }) => {
  404 |   const fixtures = createLiveCheckoutFixtures()
  405 |   let checkoutCreateCount = 0
  406 |   let paymentVerifyCount = 0
  407 | 
  408 |   await mockLiveRazorpay(page, ["verify-fail", "success"])
  409 | 
  410 |   await page.route("**/api/v1/storefront/checkout/payment/verify", async (route) => {
  411 |     paymentVerifyCount += 1
  412 | 
  413 |     if (paymentVerifyCount === 1) {
  414 |       await route.fulfill({
  415 |         status: 400,
  416 |         contentType: "application/json",
  417 |         body: JSON.stringify({ error: "Payment signature could not be verified." }),
  418 |       })
  419 |       return
  420 |     }
  421 | 
  422 |     await route.fulfill({
  423 |       status: 200,
  424 |       contentType: "application/json",
  425 |       body: JSON.stringify(fixtures.verifiedOrderResponse),
  426 |     })
  427 |   })
  428 | 
  429 |   await page.route("**/api/v1/storefront/checkout", async (route) => {
  430 |     checkoutCreateCount += 1
  431 |     await route.fulfill({
  432 |       status: 201,
  433 |       contentType: "application/json",
  434 |       body: JSON.stringify(fixtures.checkoutResponse),
  435 |     })
  436 |   })
  437 | 
  438 |   await prepareGuestCheckout(page)
  439 |   await page.getByRole("button", { name: "Continue to pay" }).click()
  440 | 
  441 |   await expect(page.getByText("Payment signature could not be verified.")).toBeVisible()
  442 |   await expect(
  443 |     page.getByRole("alert").getByRole("button", { name: "Retry payment" })
  444 |   ).toBeVisible()
  445 | 
  446 |   await page.getByRole("alert").getByRole("button", { name: "Retry payment" }).click()
```