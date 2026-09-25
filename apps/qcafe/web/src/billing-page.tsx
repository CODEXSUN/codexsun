import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BanknoteIcon, CircleDollarSignIcon, LandmarkIcon, ReceiptTextIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { changeBilling, readBilling, type BillingWorkspace } from "./billing-api";
import { readFoundationSetup } from "./foundation-setup-api";
import { readPos } from "./pos-api";

type Mode = "checkout" | "cash" | "vouchers" | "setup";

export function BillingPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  const [mode, setMode] = useState<Mode>("checkout");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "billing", business?.id, locationId] as const;
  const billing = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readBilling(request, business!.id, locationId),
  });
  const orders = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: ["qcafe", "pos", business?.id, locationId],
    queryFn: () => readPos(request, business!.id, locationId),
  });
  const change = useMutation({
    mutationFn: ({ input, path }: { input?: Record<string, unknown>; path: string }) =>
      changeBilling(request, path, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
      await client.invalidateQueries({ queryKey: ["qcafe", "foundation", "setup"] });
    },
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const location = business.locations.find((item) => item.id === locationId) ?? business.locations[0];
  const data = billing.data;
  const send = (path: string, input?: Record<string, unknown>) => change.mutate({ input, path });
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <NativeSelect
          aria-label="Outlet"
          value={locationId}
          onChange={(event) => setLocationId(event.currentTarget.value)}
        >
          {business.locations.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex flex-wrap gap-2">
          <Badge>{data?.bills.filter((bill) => bill.balance_minor > 0).length ?? 0} outstanding</Badge>
          <Badge variant="outline">
            {data?.cashShifts.filter((shift) => shift.status === "open").length ?? 0} open shifts
          </Badge>
        </div>
      </div>
      <nav aria-label="Billing views" className="flex flex-wrap gap-1 border-b pb-3">
        {(["checkout", "cash", "vouchers", "setup"] as const).map((item) => (
          <Button key={item} onClick={() => setMode(item)} size="sm" variant={mode === item ? "default" : "ghost"}>
            {item === "checkout" ? (
              <ReceiptTextIcon />
            ) : item === "cash" ? (
              <BanknoteIcon />
            ) : item === "vouchers" ? (
              <CircleDollarSignIcon />
            ) : (
              <LandmarkIcon />
            )}
            {item}
          </Button>
        ))}
      </nav>
      {mode === "checkout" ? <Checkout data={data} orders={orders.data} send={send} /> : null}
      {mode === "cash" ? <CashControl data={data} location={location} send={send} /> : null}
      {mode === "vouchers" ? (
        <Vouchers businessId={business.id} data={data} locationId={locationId} send={send} />
      ) : null}
      {mode === "setup" ? (
        <FiscalSetup businessId={business.id} data={data} locationId={locationId} send={send} />
      ) : null}
      {change.isPending ? <p className="text-sm text-muted-foreground">Recording transaction...</p> : null}
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}

function Checkout({
  data,
  orders,
  send,
}: {
  data?: BillingWorkspace;
  orders?: Awaited<ReturnType<typeof readPos>>;
  send: Sender;
}) {
  const billOrderIds = new Set(data?.bills.map((bill) => bill.order_id));
  const billable =
    orders?.orders.filter(
      (order) => ["confirmed", "fulfilled"].includes(order.status) && !billOrderIds.has(order.id),
    ) ?? [];
  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Ready to bill</h2>
        {billable.length ? (
          billable.map((order) => (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3" key={order.id}>
              <div>
                <strong className="text-sm">{order.number}</strong>
                <p className="text-xs text-muted-foreground">
                  {order.customer_name ?? "Guest"} · {money(order.total_minor, order.currency)}
                </p>
              </div>
              <Button onClick={() => send("bills", { orderId: order.id })} size="sm">
                <ReceiptTextIcon />
                Post bill
              </Button>
            </div>
          ))
        ) : (
          <Empty text="No confirmed unbilled orders." />
        )}
      </section>
      <section className="grid gap-4 border-t pt-5">
        <h2 className="text-sm font-semibold">Posted bills</h2>
        {data?.bills.map((bill) => (
          <BillRow bill={bill} data={data} key={bill.id} send={send} />
        ))}
        {!data?.bills.length ? <Empty text="Post a confirmed order to begin checkout." /> : null}
      </section>
      <Ledger data={data} send={send} />
    </div>
  );
}

function BillRow({
  bill,
  data,
  send,
}: {
  bill: BillingWorkspace["bills"][number];
  data: BillingWorkspace;
  send: Sender;
}) {
  const [methodId, setMethodId] = useState(data.paymentMethods[0]?.id ?? "");
  const openShift = data.cashShifts.find((shift) => shift.status === "open");
  return (
    <article className="grid gap-3 border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong>{bill.number}</strong>
          <p className="text-xs text-muted-foreground">
            {data.billLines
              .filter((line) => line.bill_id === bill.id)
              .map((line) => line.description)
              .join(", ")}
          </p>
        </div>
        <div className="text-right">
          <Badge variant={bill.balance_minor ? "secondary" : "default"}>{bill.status}</Badge>
          <p className="mt-1 text-sm font-semibold">Due {money(bill.balance_minor, bill.currency)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 border-y py-3 text-sm">
        <Metric label="Payable" value={money(bill.payable_minor, bill.currency)} />
        <Metric label="Tax" value={money(bill.tax_minor, bill.currency)} />
        <Metric label="Paid" value={money(bill.paid_minor, bill.currency)} />
      </div>
      {bill.balance_minor > 0 ? (
        <form
          className="grid gap-2 sm:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const method = data.paymentMethods.find((item) => item.id === methodId);
            send(`bills/${bill.id}/payments`, {
              amountMinor: toMinor(form.get("amount")),
              cashShiftId: method?.kind === "cash" ? openShift?.id : undefined,
              failureReason: form.get("status") === "failed" ? form.get("failure") : undefined,
              maskedReference: form.get("masked") || undefined,
              paymentMethodId: methodId,
              providerReference: form.get("provider") || undefined,
              receivedMinor: toMinor(form.get("received")),
              status: form.get("status"),
            });
          }}
        >
          <NativeSelect
            aria-label="Payment method"
            name="method"
            value={methodId}
            onChange={(event) => setMethodId(event.currentTarget.value)}
          >
            {data.paymentMethods
              .filter((item) => item.active)
              .map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.name}
                </NativeSelectOption>
              ))}
          </NativeSelect>
          <Input
            aria-label="Payment amount"
            defaultValue={(bill.balance_minor / 100).toFixed(2)}
            name="amount"
            required
            type="number"
            step="0.01"
          />
          <Input
            aria-label="Tender received"
            defaultValue={(bill.balance_minor / 100).toFixed(2)}
            name="received"
            required
            type="number"
            step="0.01"
          />
          <Input aria-label="Masked reference" name="masked" placeholder="****4242" />
          <NativeSelect aria-label="Payment status" name="status">
            <NativeSelectOption value="posted">Post</NativeSelectOption>
            <NativeSelectOption value="failed">Record failure</NativeSelectOption>
          </NativeSelect>
          <Input aria-label="Failure or provider reference" name="failure" placeholder="Failure reason" />
          <Input
            className="sm:col-span-2"
            aria-label="Provider reference"
            name="provider"
            placeholder="Provider reference"
          />
          <Button className="sm:col-span-2" disabled={!methodId} type="submit">
            Collect payment
          </Button>
        </form>
      ) : null}
    </article>
  );
}

function Ledger({ data, send }: { data?: BillingWorkspace; send: Sender }) {
  return (
    <section className="grid gap-3 border-t pt-5">
      <h2 className="text-sm font-semibold">Payment and receipt ledger</h2>
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Receipt</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Correction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.payments.map((payment) => {
            const receipt = data.receipts.find((item) => item.payment_id === payment.id);
            const tender = data.tenderDetails.find((item) => item.payment_id === payment.id);
            return (
              <TableRow key={payment.id}>
                <TableCell>{receipt?.number ?? "-"}</TableCell>
                <TableCell>{payment.purpose}</TableCell>
                <TableCell>
                  <Badge variant="outline">{payment.status}</Badge>
                </TableCell>
                <TableCell>
                  {payment.direction === "out" ? "-" : ""}
                  {money(payment.amount_minor)}
                </TableCell>
                <TableCell>{tender?.masked_reference ?? "-"}</TableCell>
                <TableCell>
                    {payment.status === "posted" && payment.direction === "in" && payment.purpose === "sale" ? (
                      <form
                        className="flex gap-1"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          const action = form.get("action");
                          send(`payments/${payment.id}/${action === "reversal" ? "reversals" : "refunds"}`, {
                            ...(action === "refund" ? { amountMinor: toMinor(form.get("amount")) } : {}),
                            reason: form.get("reason"),
                          });
                        }}
                      >
                        <Input
                          aria-label="Refund amount"
                          className="w-24"
                          name="amount"
                          placeholder="Amount"
                          required
                          type="number"
                          step="0.01"
                        />
                        <NativeSelect aria-label="Refund action" name="action">
                          <NativeSelectOption value="refund">Partial refund</NativeSelectOption>
                          <NativeSelectOption value="reversal">Full reversal</NativeSelectOption>
                        </NativeSelect>
                        <Input
                          aria-label="Refund reason"
                          className="w-36"
                          name="reason"
                          placeholder="Reason"
                          required
                        />
                        <Button size="sm" type="submit" variant="outline">
                          Refund
                        </Button>
                      </form>
                    ) : (
                      "-"
                    )}
                  </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

function CashControl({
  data,
  location,
  send,
}: {
  data?: BillingWorkspace;
  location?: { businessDay: { id: string; status: string } | null };
  send: Sender;
}) {
  const openShift = data?.cashShifts.find((shift) => shift.status === "open");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <QuickForm
        label="Open drawer shift"
        submit={(form) =>
          send("cash-shifts", {
            businessDayId: location?.businessDay?.id,
            drawerId: form.get("drawer"),
            openingFloatMinor: toMinor(form.get("opening")),
          })
        }
      >
        <NativeSelect aria-label="Cash drawer" name="drawer">
          {(data?.drawers ?? [])
            .filter((item) => item.active)
            .map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
        </NativeSelect>
        <Input name="opening" placeholder="Opening float" required type="number" step="0.01" />
        <Button disabled={!location?.businessDay || Boolean(openShift)} type="submit">
          Open shift
        </Button>
      </QuickForm>
      <section className="grid content-start gap-3 border-l-0 lg:border-l lg:pl-6">
        <h2 className="text-sm font-semibold">Current custody</h2>
        {openShift ? (
          <>
            <p className="text-sm">
              Opened by <strong>{openShift.cashier_ref}</strong> with {money(openShift.opening_float_minor)}
            </p>
            <QuickForm
              label="Cash movement"
              submit={(form) =>
                send(`cash-shifts/${openShift.id}/movements`, {
                  amountMinor: toMinor(form.get("amount")),
                  approvedBy: form.get("approver") || undefined,
                  kind: form.get("kind"),
                  reason: form.get("reason"),
                })
              }
            >
              <NativeSelect aria-label="Cash movement kind" name="kind">
                <NativeSelectOption value="cash_in">Cash in</NativeSelectOption>
                <NativeSelectOption value="cash_out">Cash out</NativeSelectOption>
                <NativeSelectOption value="safe_drop">Safe drop</NativeSelectOption>
              </NativeSelect>
              <Input name="amount" placeholder="Amount" required type="number" step="0.01" />
              <Input name="reason" placeholder="Reason" required />
              <Input name="approver" placeholder="Approver for cash out" />
              <Button type="submit" variant="outline">
                Record
              </Button>
            </QuickForm>
            <QuickForm
              label="Settle shift"
              submit={(form) =>
                send(`cash-shifts/${openShift.id}/settle`, {
                  approvedBy: form.get("approver") || undefined,
                  countedMinor: toMinor(form.get("counted")),
                  varianceReason: form.get("reason") || undefined,
                })
              }
            >
              <Input name="counted" placeholder="Counted cash" required type="number" step="0.01" />
              <Input name="reason" placeholder="Variance reason" />
              <Input name="approver" placeholder="Approver" />
              <Button type="submit">Settle</Button>
            </QuickForm>
          </>
        ) : (
          <Empty text="No open cash shift." />
        )}
      </section>
      <section className="grid gap-3 border-t pt-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Business day</h2>
          <Button
            disabled={!location?.businessDay || Boolean(openShift)}
            onClick={() => location?.businessDay && send(`business-days/${location.businessDay.id}/close`)}
            variant="outline"
          >
            Close day
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Day close requires all drawer shifts to be settled.</p>
      </section>
    </div>
  );
}

function Vouchers({
  businessId,
  data,
  locationId,
  send,
}: {
  businessId: string;
  data?: BillingWorkspace;
  locationId: string;
  send: Sender;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <QuickForm
        label="Issue advance voucher"
        submit={(form) =>
          send("vouchers", {
            amountMinor: toMinor(form.get("amount")),
            businessId,
            customerRef: form.get("customer") || undefined,
            eventRef: form.get("event") || undefined,
            locationId,
            paymentMethodId: form.get("method"),
            providerReference: form.get("provider") || undefined,
          })
        }
      >
        <Input name="amount" placeholder="Advance amount" required type="number" step="0.01" />
        <Input name="customer" placeholder="Customer reference" />
        <Input name="event" placeholder="Event reference" />
        <NativeSelect aria-label="Voucher payment method" name="method">
          {(data?.paymentMethods ?? [])
            .filter((item) => item.active && item.kind !== "cash")
            .map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
        </NativeSelect>
        <Input name="provider" placeholder="Provider reference" />
        <Button type="submit">Issue voucher</Button>
      </QuickForm>
      <section className="grid content-start gap-3 border-l-0 lg:border-l lg:pl-6">
        <h2 className="text-sm font-semibold">Advance balances</h2>
        {data?.vouchers.map((voucher) => (
          <form
            className="grid gap-2 border-b pb-3"
            key={voucher.id}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              send(`vouchers/${voucher.id}/applications`, {
                amountMinor: toMinor(form.get("amount")),
                billId: form.get("bill"),
              });
            }}
          >
            <div className="flex justify-between gap-2">
              <strong className="text-sm">{voucher.number}</strong>
              <Badge variant="outline">{money(voucher.remaining_value_minor)} left</Badge>
            </div>
            <NativeSelect aria-label="Bill to apply voucher" name="bill">
              {(data?.bills ?? [])
                .filter((bill) => bill.balance_minor > 0)
                .map((bill) => (
                  <NativeSelectOption key={bill.id} value={bill.id}>
                    {`${bill.number} · ${money(bill.balance_minor, bill.currency)}`}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
            <div className="flex gap-2">
              <Input name="amount" placeholder="Apply amount" required type="number" step="0.01" />
              <Button size="sm" type="submit" variant="outline">
                Apply
              </Button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}

function FiscalSetup({
  businessId,
  data,
  locationId,
  send,
}: {
  businessId: string;
  data?: BillingWorkspace;
  locationId: string;
  send: Sender;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <QuickForm
        label="Tax rate"
        submit={(form) =>
          send("tax-rates", {
            basisPoints: Math.round(Number(form.get("percent")) * 100),
            businessId,
            code: form.get("code"),
            name: form.get("name"),
          })
        }
      >
        <Input name="name" placeholder="GST 5%" required />
        <Input name="code" placeholder="GST5" required />
        <Input name="percent" placeholder="Percent" required type="number" min="0" max="100" step="0.01" />
        <Button type="submit">Save rate</Button>
      </QuickForm>
      <section className="grid content-start gap-3 border-l-0 lg:border-l lg:pl-6">
        <h2 className="text-sm font-semibold">Accepted tenders</h2>
        {!data?.paymentMethods.length || !data.drawers.length ? (
          <Button onClick={() => send("defaults", { businessId, locationId })} variant="outline">
            Install outlet defaults
          </Button>
        ) : null}
        {data?.paymentMethods.map((method) => (
          <div className="flex items-center justify-between border-b py-2 text-sm" key={method.id}>
            <span>{method.name}</span>
            <Badge variant="outline">{method.kind}</Badge>
          </div>
        ))}
        <h2 className="mt-3 text-sm font-semibold">Tax registry</h2>
        {data?.taxRates.map((rate) => (
          <div className="flex items-center justify-between border-b py-2 text-sm" key={rate.id}>
            <span>
              {rate.code} · {rate.name}
            </span>
            <strong>{(rate.basis_points / 100).toFixed(2)}%</strong>
          </div>
        ))}
      </section>
    </div>
  );
}

type Sender = (path: string, input?: Record<string, unknown>) => void;
function QuickForm({
  children,
  label,
  submit,
}: {
  children: React.ReactNode;
  label: string;
  submit: (form: FormData) => void;
}) {
  return (
    <form
      className="grid content-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
        event.currentTarget.reset();
      }}
    >
      <h2 className="text-sm font-semibold">{label}</h2>
      {children}
    </form>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{text}</p>;
}
function toMinor(value: FormDataEntryValue | null) {
  return Math.round(Number(value ?? 0) * 100);
}
function money(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { currency, style: "currency" }).format(value / 100);
}
