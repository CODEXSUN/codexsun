# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storefront-checkout.spec.ts >> authenticated customer can sign in from cart, return to checkout, and place an order
- Location: tests\e2e\storefront-checkout.spec.ts:454:1

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
              - /url: /customer/wishlist
              - img
            - link "1" [ref=e27] [cursor=pointer]:
              - /url: /cart
              - img
              - generic [ref=e28]: "1"
          - generic [ref=e29]:
            - button "Account" [ref=e30] [cursor=pointer]:
              - img
              - generic [ref=e31]: Account
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
                  - radio "Saved address 1 Default Customer Demo +919000000003 45 Test Street Chennai, Chennai, Tamil Nadu, India 600001" [checked] [ref=e63]
                  - radio [checked] [ref=e66]
                  - generic [ref=e67]:
                    - generic [ref=e68]:
                      - generic [ref=e69]: Saved address 1
                      - generic [ref=e70]: Default
                    - generic [ref=e71]:
                      - paragraph [ref=e72]: Customer Demo
                      - paragraph [ref=e73]: "+919000000003"
                      - paragraph [ref=e74]: 45 Test Street
                      - paragraph [ref=e75]: Chennai, Chennai, Tamil Nadu, India 600001
                  - img [ref=e77]
              - generic [ref=e80]:
                - generic [ref=e81]:
                  - generic [ref=e82]: Contact email
                  - textbox "Contact email" [ref=e83]: customer@codexsun.local
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
                - textbox "Coupon code" [ref=e161]:
                  - /placeholder: Enter your coupon code
              - paragraph [ref=e162]: Active customer coupons from your portal can be used once and will be reserved for this pending order until payment succeeds, fails, or expires.
          - complementary [ref=e163]:
            - generic [ref=e165]:
              - generic [ref=e166]:
                - heading "Order summary" [level=2] [ref=e167]
                - paragraph [ref=e168]: A quick view of the garments in this order, delivery charges, and the final payable total.
              - generic [ref=e170]:
                - img "Aster Linen Shirt" [ref=e173]
                - generic [ref=e174]:
                  - paragraph [ref=e175]: Aster Linen Shirt
                  - paragraph [ref=e176]: Selected style / Qty 1
                  - generic [ref=e178]: ₹1,890
              - generic [ref=e179]: You are saving ₹340 on this order.
              - generic [ref=e180]:
                - generic [ref=e181]:
                  - generic [ref=e182]: Subtotal
                  - generic [ref=e185]: ₹1,890
                - generic [ref=e186]:
                  - generic [ref=e187]: Shipping
                  - generic [ref=e190]: ₹149
                - generic [ref=e191]:
                  - paragraph [ref=e192]: Standard delivery
                  - paragraph [ref=e193]: Dispatch within 24 hours via Delhivery Surface. ETA 4-6 days.
                  - paragraph [ref=e194]: Zone Metro South · COD eligible
                - generic [ref=e195]:
                  - generic [ref=e196]: Handling
                  - generic [ref=e199]: ₹99
                - generic [ref=e200]:
                  - generic [ref=e201]: Payment
                  - generic [ref=e202]: Razorpay Checkout
                - generic [ref=e203]:
                  - generic [ref=e204]: Total
                  - generic [ref=e207]: ₹2,138
              - button "Continue to pay" [ref=e208] [cursor=pointer]
              - generic [ref=e209]:
                - generic [ref=e210]:
                  - img [ref=e211]
                  - generic [ref=e216]:
                    - paragraph [ref=e217]: Delivery preview
                    - paragraph [ref=e218]: Standard delivery stays attached to this checkout so the order can carry the delivery preference into fulfillment.
                - generic [ref=e219]:
                  - img [ref=e220]
                  - generic [ref=e223]:
                    - paragraph [ref=e224]: Secure checkout
                    - paragraph [ref=e225]: Address confirmation, payment, and order verification stay inside the secure storefront payment flow.
                - generic [ref=e226]:
                  - img [ref=e227]
                  - generic [ref=e230]:
                    - paragraph [ref=e231]: Storefront matched
                    - paragraph [ref=e232]: Borders, spacing, and the summary surface now follow the same warm storefront composition as the cart page.
    - contentinfo [ref=e234]:
      - generic [ref=e236]:
        - generic [ref=e237]:
          - link "Codexsun Commerce Codexsun Commerce Suite-first commerce and operations software." [ref=e238] [cursor=pointer]:
            - /url: /
            - img "Codexsun Commerce" [ref=e240]
            - generic [ref=e241]:
              - paragraph [ref=e242]: Codexsun Commerce
              - paragraph [ref=e243]: Suite-first commerce and operations software.
          - paragraph [ref=e245]: A premium storefront built on shared core masters, with ecommerce-owned cart, checkout, tracking, and customer portal flows.
          - generic [ref=e246]:
            - generic [ref=e247]:
              - img [ref=e248]
              - generic [ref=e251]: 18 North Residency, Cathedral Road, Nungambakkam
            - generic [ref=e252]:
              - img [ref=e253]
              - link "+91 90000 12345" [ref=e255] [cursor=pointer]:
                - /url: tel:919000012345
            - generic [ref=e256]:
              - img [ref=e257]
              - link "storefront@codexsun.local" [ref=e260] [cursor=pointer]:
                - /url: mailto:storefront@codexsun.local
        - generic [ref=e261]:
          - heading "Top categories" [level=3] [ref=e262]
          - list [ref=e263]:
            - listitem [ref=e264]:
              - link "Men's Knitwear" [ref=e265] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e266]:
              - link "Women's Knitwear" [ref=e267] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e268]:
              - link "Kids and Infantwear" [ref=e269] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e270]:
              - link "Inner Wears" [ref=e271] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e272]:
              - link "Corporate and Festival Tees" [ref=e273] [cursor=pointer]:
                - /url: /catalog
            - listitem [ref=e274]:
              - link "View All Categories" [ref=e275] [cursor=pointer]:
                - /url: /catalog
        - generic [ref=e276]:
          - heading "Order support" [level=3] [ref=e277]
          - list [ref=e278]:
            - listitem [ref=e279]:
              - link "Track Factory Dispatch" [ref=e280] [cursor=pointer]:
                - /url: /track-order
            - listitem [ref=e281]:
              - link "Bulk Order Enquiry" [ref=e282] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e283]:
              - link "Sampling and Sourcing" [ref=e284] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e285]:
              - link "Size and Fit Assistance" [ref=e286] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e287]:
              - link "Contact Textile Desk" [ref=e288] [cursor=pointer]:
                - /url: /profile
        - generic [ref=e289]:
          - heading "About the brand" [level=3] [ref=e290]
          - list [ref=e291]:
            - listitem [ref=e292]:
              - link "Tiruppur Story" [ref=e293] [cursor=pointer]:
                - /url: /
            - listitem [ref=e294]:
              - link "Factory-Direct Promise" [ref=e295] [cursor=pointer]:
                - /url: /
            - listitem [ref=e296]:
              - link "Private Label Support" [ref=e297] [cursor=pointer]:
                - /url: /
            - listitem [ref=e298]:
              - link "Retail and Wholesale Supply" [ref=e299] [cursor=pointer]:
                - /url: /
            - listitem [ref=e300]:
              - link "Join as Buying Partner" [ref=e301] [cursor=pointer]:
                - /url: /
        - generic [ref=e302]:
          - heading "Trade information" [level=3] [ref=e303]
          - list [ref=e304]:
            - listitem [ref=e305]:
              - link "Terms & Conditions" [ref=e306] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e307]:
              - link "Privacy Policy" [ref=e308] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e309]:
              - link "Shipping Information" [ref=e310] [cursor=pointer]:
                - /url: /shipping
            - listitem [ref=e311]:
              - link "Returns & Exchanges" [ref=e312] [cursor=pointer]:
                - /url: /returns
            - listitem [ref=e313]:
              - link "Contact and Support" [ref=e314] [cursor=pointer]:
                - /url: /contact
      - generic [ref=e316]:
        - link "Instagram" [ref=e318] [cursor=pointer]:
          - /url: https://instagram.com/codexsun
          - img [ref=e319]
          - generic [ref=e321]: Instagram
        - generic [ref=e322]: All rights reserved.
    - button "Open contact actions" [ref=e324] [cursor=pointer]:
      - img [ref=e325]
```

# Test source

```ts
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
  447 | 
  448 |   await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
  449 |   expect(checkoutCreateCount).toBe(1)
  450 |   expect(paymentVerifyCount).toBe(2)
  451 |   await expect.poll(() => page.evaluate(() => (window as Window & { __razorpayOpenCount?: number }).__razorpayOpenCount ?? 0)).toBe(2)
  452 | })
  453 | 
  454 | test("authenticated customer can sign in from cart, return to checkout, and place an order", async ({
  455 |   page,
  456 | }) => {
  457 |   await page.goto("/")
  458 |   await page.evaluate(() => {
  459 |     window.localStorage.setItem(
  460 |       "codexsun.storefront.cart",
  461 |       JSON.stringify([
  462 |         {
  463 |           productId: "core-product:aster-linen-shirt",
  464 |           slug: "aster-linen-shirt",
  465 |           name: "Aster Linen Shirt",
  466 |           imageUrl: null,
  467 |           quantity: 1,
  468 |           unitPrice: 1890,
  469 |           mrp: 2230,
  470 |         },
  471 |       ])
  472 |     )
  473 |   })
  474 | 
  475 |   await page.goto("/cart")
  476 |   await page.getByRole("button", { name: "Proceed to checkout" }).click()
  477 |   await expect(page.getByRole("heading", { name: "Choose how to continue." })).toBeVisible()
  478 |   await page.getByRole("button", { name: "Existing customer" }).click()
  479 | 
  480 |   await expect(page).toHaveURL(/\/login$/)
  481 |   await page.getByLabel("Email").fill("customer@codexsun.local")
  482 |   await page.getByLabel("Password").fill("Customer@12345")
  483 |   await page.getByRole("button", { name: "Login" }).click()
  484 | 
  485 |   await expect(page).toHaveURL(/\/checkout$/)
  486 |   await expect(
  487 |     page.getByRole("heading", { name: "Delivery, payment, and final review." })
  488 |   ).toBeVisible()
  489 |   await expect(page.getByRole("radio", { name: /Customer Demo/ }).last()).toBeChecked()
  490 | 
  491 |   await page.getByRole("button", { name: "Continue to pay" }).click()
> 492 |   await expect(page.getByRole("heading", { name: /Order confirmed/ })).toBeVisible()
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  493 |   await page.getByRole("link", { name: "Open order page" }).click()
  494 |   await expect(page).toHaveURL(/\/customer\/orders\//)
  495 |   await expect(page.getByText("Order overview")).toBeVisible()
  496 | })
  497 | 
```