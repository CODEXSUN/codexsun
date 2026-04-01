import type {
  AccountingVoucher,
  AccountingVoucherLine,
  CommerceInvoice,
  CommerceInvoiceItem,
  CommerceOrderEvent,
  CommerceOrderEventType,
  CommerceOrderStatus,
  CommerceOrderSummary,
  CommerceOrderWorkflow,
  CommerceShipment,
  CommerceShipmentEvent,
  CommerceWorkflowActionPayload,
  StorefrontOrder,
} from '@shared/index'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { commerceTableNames, storefrontTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { StorefrontOrderRepository } from '../../storefront/data/storefront-order-repository'
import { CommerceNotificationService } from '../application/commerce-notification-service'

type JsonPrimitive = string | number | boolean | null

interface OrderSummaryRow extends RowDataPacket {
  id: string
  order_number: string
  first_name: string
  last_name: string
  status: string
  payment_status: string
  total_amount: number | string
  currency_code: string
  created_at: Date | string
  shipment_status: string | null
  invoice_status: string | null
}

interface OrderEventRow extends RowDataPacket {
  id: string
  order_id: string
  event_type: string
  title: string
  description: string | null
  status_after: string
  metadata_json: string | null
  occurred_at: Date | string
  created_at: Date | string
}

interface ShipmentRow extends RowDataPacket {
  id: string
  order_id: string
  shipment_number: string
  status: string
  courier_name: string | null
  courier_service: string | null
  tracking_number: string | null
  tracking_url: string | null
  pickup_requested_at: Date | string | null
  picked_up_at: Date | string | null
  estimated_delivery_at: Date | string | null
  delivered_at: Date | string | null
  delivery_confirmed_at: Date | string | null
  notes: string | null
  created_at: Date | string
  updated_at: Date | string
}

interface ShipmentEventRow extends RowDataPacket {
  id: string
  shipment_id: string
  order_id: string
  event_type: string
  title: string
  description: string | null
  location_name: string | null
  event_time: Date | string
  metadata_json: string | null
  created_at: Date | string
}

interface InvoiceRow extends RowDataPacket {
  id: string
  order_id: string
  invoice_number: string
  status: string
  issue_date: Date | string
  due_date: Date | string | null
  subtotal: number | string
  shipping_amount: number | string
  handling_amount: number | string
  total_amount: number | string
  currency_code: string
  payment_status: string
  created_at: Date | string
  updated_at: Date | string
}

interface InvoiceItemRow extends RowDataPacket {
  id: string
  invoice_id: string
  order_item_id: string
  product_id: string
  description: string
  quantity: number | string
  unit_price: number | string
  line_total: number | string
}

interface VoucherRow extends RowDataPacket {
  id: string
  source_type: string
  source_id: string
  voucher_type: string
  voucher_number: string
  posting_date: Date | string
  effective_date: Date | string
  memo: string | null
  created_at: Date | string
}

interface VoucherLineRow extends RowDataPacket {
  id: string
  voucher_id: string
  ledger_code: string
  ledger_name: string
  debit_amount: number | string
  credit_amount: number | string
  narration: string | null
}

interface IdRow extends RowDataPacket {
  id: string
}

function asTimestamp(value: Date | string | null) {
  return value ? new Date(value).toISOString() : null
}

function parseMetadata(value: string | null) {
  if (!value) {
    return {}
  }

  try {
    return JSON.parse(value) as Record<string, JsonPrimitive>
  } catch {
    return {}
  }
}

function createSequence(prefix: string) {
  const now = new Date()
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `${prefix}-${datePart}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function mapOrderEvent(row: OrderEventRow): CommerceOrderEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type as CommerceOrderEventType,
    title: row.title,
    description: row.description,
    statusAfter: row.status_after as CommerceOrderStatus,
    metadata: parseMetadata(row.metadata_json),
    occurredAt: asTimestamp(row.occurred_at)!,
    createdAt: asTimestamp(row.created_at)!,
  }
}

function mapShipment(row: ShipmentRow): CommerceShipment {
  return {
    id: row.id,
    orderId: row.order_id,
    shipmentNumber: row.shipment_number,
    status: row.status as CommerceShipment['status'],
    courierName: row.courier_name,
    courierService: row.courier_service,
    trackingNumber: row.tracking_number,
    trackingUrl: row.tracking_url,
    pickupRequestedAt: asTimestamp(row.pickup_requested_at),
    pickedUpAt: asTimestamp(row.picked_up_at),
    estimatedDeliveryAt: asTimestamp(row.estimated_delivery_at),
    deliveredAt: asTimestamp(row.delivered_at),
    deliveryConfirmedAt: asTimestamp(row.delivery_confirmed_at),
    notes: row.notes,
    createdAt: asTimestamp(row.created_at)!,
    updatedAt: asTimestamp(row.updated_at)!,
  }
}

function mapShipmentEvent(row: ShipmentEventRow): CommerceShipmentEvent {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    orderId: row.order_id,
    eventType: row.event_type as CommerceOrderEventType,
    title: row.title,
    description: row.description,
    locationName: row.location_name,
    eventTime: asTimestamp(row.event_time)!,
    metadata: parseMetadata(row.metadata_json),
    createdAt: asTimestamp(row.created_at)!,
  }
}

function mapInvoiceItem(row: InvoiceItemRow): CommerceInvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    orderItemId: row.order_item_id,
    productId: row.product_id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  }
}

function mapInvoice(row: InvoiceRow, items: CommerceInvoiceItem[]): CommerceInvoice {
  return {
    id: row.id,
    orderId: row.order_id,
    invoiceNumber: row.invoice_number,
    status: row.status as CommerceInvoice['status'],
    issueDate: asTimestamp(row.issue_date)!,
    dueDate: asTimestamp(row.due_date),
    subtotal: Number(row.subtotal),
    shippingAmount: Number(row.shipping_amount),
    handlingAmount: Number(row.handling_amount),
    totalAmount: Number(row.total_amount),
    currency: row.currency_code,
    paymentStatus: row.payment_status,
    createdAt: asTimestamp(row.created_at)!,
    updatedAt: asTimestamp(row.updated_at)!,
    items,
  }
}

function mapVoucherLine(row: VoucherLineRow): AccountingVoucherLine {
  return {
    id: row.id,
    voucherId: row.voucher_id,
    ledgerCode: row.ledger_code,
    ledgerName: row.ledger_name,
    debitAmount: Number(row.debit_amount),
    creditAmount: Number(row.credit_amount),
    narration: row.narration,
  }
}

function mapVoucher(row: VoucherRow, lines: AccountingVoucherLine[]): AccountingVoucher {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    voucherType: row.voucher_type,
    voucherNumber: row.voucher_number,
    postingDate: asTimestamp(row.posting_date)!,
    effectiveDate: asTimestamp(row.effective_date)!,
    memo: row.memo,
    createdAt: asTimestamp(row.created_at)!,
    lines,
  }
}

function resolveWorkflowState(
  eventType: CommerceWorkflowActionPayload['eventType'],
  currentOrderStatus: CommerceOrderStatus,
  currentShipmentStatus: CommerceShipment['status'],
): { orderStatus: CommerceOrderStatus; shipmentStatus: CommerceShipment['status'] } | null {
  switch (eventType) {
    case 'prepare_delivery':
      return { orderStatus: 'preparing_delivery', shipmentStatus: 'preparing' }
    case 'packed':
      return { orderStatus: 'packed', shipmentStatus: 'packed' }
    case 'courier_assigned':
      return { orderStatus: 'courier_assigned', shipmentStatus: 'courier_assigned' }
    case 'picked_up':
      return { orderStatus: 'picked_up', shipmentStatus: 'picked_up' }
    case 'estimated_delivery_updated':
      return { orderStatus: currentOrderStatus, shipmentStatus: currentShipmentStatus }
    case 'tracking_updated':
      return { orderStatus: 'in_transit', shipmentStatus: 'in_transit' }
    case 'in_transit':
      return { orderStatus: 'in_transit', shipmentStatus: 'in_transit' }
    case 'out_for_delivery':
      return { orderStatus: 'out_for_delivery', shipmentStatus: 'out_for_delivery' }
    case 'delivered':
      return { orderStatus: 'delivered', shipmentStatus: 'delivered' }
    case 'delivery_confirmed':
      return { orderStatus: 'delivery_confirmed', shipmentStatus: 'delivery_confirmed' }
    case 'cancelled':
      return { orderStatus: 'cancelled', shipmentStatus: 'cancelled' }
    default:
      return null
  }
}

export class CommerceOrderWorkflowRepository {
  private readonly storefrontOrderRepository = new StorefrontOrderRepository()
  private readonly notificationService = new CommerceNotificationService()

  async listOrders() {
    await ensureDatabaseSchema()
    const rows = await db.query<OrderSummaryRow>(
      `
        SELECT
          o.id,
          o.order_number,
          o.first_name,
          o.last_name,
          o.status,
          o.payment_status,
          o.total_amount,
          o.currency_code,
          o.created_at,
          s.status AS shipment_status,
          i.status AS invoice_status
        FROM ${storefrontTableNames.orders} o
        LEFT JOIN ${commerceTableNames.shipments} s ON s.order_id = o.id
        LEFT JOIN ${commerceTableNames.invoices} i ON i.order_id = o.id
        ORDER BY o.created_at DESC
      `,
    )

    return rows.map((row) => ({
      orderId: row.id,
      orderNumber: row.order_number,
      customerName: `${row.first_name} ${row.last_name}`.trim(),
      status: row.status as CommerceOrderStatus,
      paymentStatus: row.payment_status,
      shipmentStatus: row.shipment_status as CommerceOrderSummary['shipmentStatus'],
      invoiceStatus: row.invoice_status as CommerceOrderSummary['invoiceStatus'],
      totalAmount: Number(row.total_amount),
      currency: row.currency_code,
      createdAt: asTimestamp(row.created_at)!,
    } satisfies CommerceOrderSummary))
  }

  async getWorkflow(orderId: string): Promise<CommerceOrderWorkflow> {
    const order = await this.storefrontOrderRepository.getById(orderId)

    const [eventRows, shipmentRows, shipmentEventRows, invoiceRows, voucherRows] = await Promise.all([
      db.query<OrderEventRow>(`SELECT * FROM ${commerceTableNames.orderEvents} WHERE order_id = ? ORDER BY occurred_at ASC, created_at ASC`, [orderId]),
      db.query<ShipmentRow>(`SELECT * FROM ${commerceTableNames.shipments} WHERE order_id = ? ORDER BY created_at ASC`, [orderId]),
      db.query<ShipmentEventRow>(`SELECT * FROM ${commerceTableNames.shipmentEvents} WHERE order_id = ? ORDER BY event_time ASC, created_at ASC`, [orderId]),
      db.query<InvoiceRow>(`SELECT * FROM ${commerceTableNames.invoices} WHERE order_id = ? LIMIT 1`, [orderId]),
      db.query<VoucherRow>(`SELECT * FROM ${commerceTableNames.vouchers} WHERE source_type = 'storefront_order' AND source_id = ? ORDER BY created_at ASC`, [orderId]),
    ])

    const shipment = shipmentRows[0] ? mapShipment(shipmentRows[0]) : null
    const invoiceRow = invoiceRows[0] ?? null
    const invoiceItems = invoiceRow
      ? (await db.query<InvoiceItemRow>(`SELECT * FROM ${commerceTableNames.invoiceItems} WHERE invoice_id = ? ORDER BY created_at ASC`, [invoiceRow.id])).map(mapInvoiceItem)
      : []
    const vouchers = await Promise.all(voucherRows.map(async (voucherRow) => {
      const lines = await db.query<VoucherLineRow>(`SELECT * FROM ${commerceTableNames.voucherLines} WHERE voucher_id = ? ORDER BY created_at ASC`, [voucherRow.id])
      return mapVoucher(voucherRow, lines.map(mapVoucherLine))
    }))

    return {
      order,
      events: eventRows.map(mapOrderEvent),
      shipment,
      shipmentEvents: shipmentEventRows.map(mapShipmentEvent),
      invoice: invoiceRow ? mapInvoice(invoiceRow, invoiceItems) : null,
      accountingVouchers: vouchers,
    }
  }

  async initializeOrder(order: StorefrontOrder) {
    await ensureDatabaseSchema()

    const hasShipment = await db.first<IdRow>(
      `SELECT id FROM ${commerceTableNames.shipments} WHERE order_id = ? LIMIT 1`,
      [order.id],
    )
    if (hasShipment) {
      return this.getWorkflow(order.id)
    }

    const shipmentId = randomUUID()
    const shipmentNumber = createSequence('SHP')
    const invoiceId = randomUUID()
    const invoiceNumber = createSequence('INV')
    const now = new Date()
    const invoiceStatus = order.status === 'pending_payment' ? 'draft' : 'issued'

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `INSERT INTO ${commerceTableNames.shipments} (id, order_id, shipment_number, status, pickup_requested_at, notes) VALUES (?, ?, ?, ?, ?, ?)`,
        [shipmentId, order.id, shipmentNumber, order.status === 'pending_payment' ? 'pending' : 'preparing', now, 'Shipment created from storefront order workflow.'],
      )

      await this.insertOrderEvent(transaction.execute.bind(transaction), {
        orderId: order.id,
        eventType: 'order_received',
        title: 'Order received',
        description: 'Customer order was created and entered the commerce workflow.',
        statusAfter: order.status as CommerceOrderStatus,
        occurredAt: now,
        metadata: { orderNumber: order.orderNumber },
      })

      if (order.status === 'pending_payment') {
        await this.insertOrderEvent(transaction.execute.bind(transaction), {
          orderId: order.id,
          eventType: 'payment_pending',
          title: 'Payment pending',
          description: 'Online payment session was created and is awaiting capture.',
          statusAfter: 'pending_payment',
          occurredAt: now,
          metadata: { paymentMethod: order.paymentMethod },
        })
      }

      await this.insertShipmentEvent(transaction.execute.bind(transaction), {
        shipmentId,
        orderId: order.id,
        eventType: 'order_received',
        title: 'Shipment initiated',
        description: 'Shipment record created for order fulfillment.',
        eventTime: now,
        metadata: { shipmentNumber },
      })

      await transaction.execute(
        `INSERT INTO ${commerceTableNames.invoices} (id, order_id, invoice_number, status, issue_date, due_date, subtotal, shipping_amount, handling_amount, total_amount, currency_code, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, order.id, invoiceNumber, invoiceStatus, now, order.paymentMethod === 'cod' ? now : null, order.subtotal, order.shippingAmount, order.handlingAmount, order.totalAmount, order.currency, order.paymentStatus],
      )

      for (const item of order.items) {
        await transaction.execute(
          `INSERT INTO ${commerceTableNames.invoiceItems} (id, invoice_id, order_item_id, product_id, description, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), invoiceId, item.id, item.productId, `${item.productName} (${item.size}/${item.color})`, item.quantity, item.unitPrice, item.lineTotal],
        )
      }

      await this.insertOrderEvent(transaction.execute.bind(transaction), {
        orderId: order.id,
        eventType: 'invoice_issued',
        title: invoiceStatus === 'draft' ? 'Invoice draft created' : 'Invoice issued',
        description: 'Sales invoice record was generated from the order.',
        statusAfter: order.status as CommerceOrderStatus,
        occurredAt: now,
        metadata: { invoiceNumber, invoiceStatus },
      })
    })

    if (order.status === 'pending_payment') {
      await this.notificationService.sendOrderReceivedEmail(order)
    } else {
      await this.notificationService.sendOrderReceivedEmail(order)
      await this.notificationService.sendOrderConfirmedEmail(order)
    }

    if (order.paymentStatus === 'captured') {
      await this.postAccountingForOrder(order.id, 'captured')
    } else if (order.paymentMethod === 'cod') {
      await this.postAccountingForOrder(order.id, 'receivable')
    }

    return this.getWorkflow(order.id)
  }

  async markPaymentCaptured(orderId: string) {
    await ensureDatabaseSchema()
    const order = await this.storefrontOrderRepository.getById(orderId)

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `UPDATE ${commerceTableNames.invoices} SET status = 'paid', payment_status = 'captured' WHERE order_id = ?`,
        [orderId],
      )

      await this.insertOrderEvent(transaction.execute.bind(transaction), {
        orderId,
        eventType: 'payment_captured',
        title: 'Payment captured',
        description: 'Online payment was captured successfully.',
        statusAfter: order.status as CommerceOrderStatus,
        occurredAt: new Date(),
        metadata: { paymentGateway: order.paymentGateway },
      })

      await this.insertOrderEvent(transaction.execute.bind(transaction), {
        orderId,
        eventType: 'invoice_paid',
        title: 'Invoice marked paid',
        description: 'Invoice payment status was updated after payment capture.',
        statusAfter: order.status as CommerceOrderStatus,
        occurredAt: new Date(),
        metadata: { paymentStatus: 'captured' },
      })
    })

    await this.notificationService.sendOrderConfirmedEmail(order)
    await this.postAccountingForOrder(orderId, 'captured')
  }

  async applyWorkflowAction(orderId: string, payload: CommerceWorkflowActionPayload) {
    await ensureDatabaseSchema()
    const order = await this.storefrontOrderRepository.getById(orderId)
    const shipmentRow = await db.first<ShipmentRow>(`SELECT * FROM ${commerceTableNames.shipments} WHERE order_id = ? LIMIT 1`, [orderId])
    if (!shipmentRow) {
      throw new ApplicationError('Shipment workflow is missing for this order.', { orderId }, 404)
    }

    const nextState = resolveWorkflowState(
      payload.eventType,
      order.status as CommerceOrderStatus,
      shipmentRow.status as CommerceShipment['status'],
    )
    if (!nextState) {
      throw new ApplicationError('This workflow event is not supported for manual fulfillment updates.', { eventType: payload.eventType }, 400)
    }

    const eventTime = payload.eventTime ? new Date(payload.eventTime) : new Date()
    const title = payload.title?.trim() || this.defaultTitleForEvent(payload.eventType)
    const description = payload.description?.trim() || null
    const metadata: Record<string, JsonPrimitive> = {}
    if (payload.courierName) metadata.courierName = payload.courierName
    if (payload.courierService) metadata.courierService = payload.courierService
    if (payload.trackingNumber) metadata.trackingNumber = payload.trackingNumber
    if (payload.trackingUrl) metadata.trackingUrl = payload.trackingUrl
    if (payload.estimatedDeliveryAt) metadata.estimatedDeliveryAt = payload.estimatedDeliveryAt
    if (payload.locationName) metadata.locationName = payload.locationName

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `UPDATE ${storefrontTableNames.orders} SET status = ? WHERE id = ?`,
        [nextState.orderStatus, orderId],
      )

      const shipmentUpdates: string[] = ['status = ?']
      const shipmentParams: Array<string | Date | null> = [nextState.shipmentStatus]

      if (payload.courierName !== undefined) {
        shipmentUpdates.push('courier_name = ?')
        shipmentParams.push(payload.courierName || null)
      }
      if (payload.courierService !== undefined) {
        shipmentUpdates.push('courier_service = ?')
        shipmentParams.push(payload.courierService || null)
      }
      if (payload.trackingNumber !== undefined) {
        shipmentUpdates.push('tracking_number = ?')
        shipmentParams.push(payload.trackingNumber || null)
      }
      if (payload.trackingUrl !== undefined) {
        shipmentUpdates.push('tracking_url = ?')
        shipmentParams.push(payload.trackingUrl || null)
      }
      if (payload.notes !== undefined) {
        shipmentUpdates.push('notes = ?')
        shipmentParams.push(payload.notes || null)
      }
      if (payload.eventType === 'picked_up') {
        shipmentUpdates.push('picked_up_at = ?')
        shipmentParams.push(eventTime)
      }
      if (payload.eventType === 'delivered') {
        shipmentUpdates.push('delivered_at = ?')
        shipmentParams.push(eventTime)
      }
      if (payload.eventType === 'delivery_confirmed') {
        shipmentUpdates.push('delivery_confirmed_at = ?')
        shipmentParams.push(eventTime)
      }
      if (payload.estimatedDeliveryAt) {
        shipmentUpdates.push('estimated_delivery_at = ?')
        shipmentParams.push(new Date(payload.estimatedDeliveryAt))
      }

      shipmentParams.push(shipmentRow.id)
      await transaction.execute(
        `UPDATE ${commerceTableNames.shipments} SET ${shipmentUpdates.join(', ')} WHERE id = ?`,
        shipmentParams,
      )

      await this.insertOrderEvent(transaction.execute.bind(transaction), {
        orderId,
        eventType: payload.eventType,
        title,
        description,
        statusAfter: nextState.orderStatus,
        occurredAt: eventTime,
        metadata,
      })

      await this.insertShipmentEvent(transaction.execute.bind(transaction), {
        shipmentId: shipmentRow.id,
        orderId,
        eventType: payload.eventType,
        title,
        description,
        locationName: payload.locationName?.trim() || null,
        eventTime,
        metadata,
      })
    })

    if (payload.eventType === 'picked_up' || payload.eventType === 'in_transit') {
      await this.notificationService.sendOrderShippedEmail(order, mapShipment(shipmentRow))
    } else if (payload.eventType === 'delivered') {
      await this.notificationService.sendOrderDeliveredEmail(order)
    } else if (payload.eventType === 'cancelled') {
      await this.notificationService.sendOrderCancelledEmail(order, payload.description || undefined)
    }

    return this.getWorkflow(orderId)
  }

  async renderInvoiceHtml(orderId: string) {
    const workflow = await this.getWorkflow(orderId)
    const invoice = workflow.invoice
    if (!invoice) {
      throw new ApplicationError('Invoice could not be found for this order.', { orderId }, 404)
    }

    const addressLines = [
      `${workflow.order.firstName} ${workflow.order.lastName}`,
      workflow.order.addressLine1,
      workflow.order.addressLine2,
      `${workflow.order.city}, ${workflow.order.state} ${workflow.order.postalCode}`,
      workflow.order.country,
      workflow.order.phone,
      workflow.order.email,
    ].filter(Boolean)

    const itemRows = invoice.items.map((item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #ddd;">${item.description}</td>
        <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">${item.unitPrice.toFixed(2)}</td>
        <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">${item.lineTotal.toFixed(2)}</td>
      </tr>
    `).join('')

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    h1, h2, h3, p { margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .totals { width: 320px; margin-left: auto; margin-top: 24px; }
    .totals div { display:flex; justify-content:space-between; padding:8px 0; }
    .totals .total { font-weight: 700; border-top: 1px solid #ddd; margin-top: 8px; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Tax Invoice</h1>
  <p style="margin-top:8px;">Invoice ${invoice.invoiceNumber}</p>
  <div class="grid">
    <div class="card">
      <h3>Bill To</h3>
      <div style="margin-top:12px; line-height:1.6;">${addressLines.join('<br/>')}</div>
    </div>
    <div class="card">
      <h3>Order Details</h3>
      <div style="margin-top:12px; line-height:1.8;">
        Order: ${workflow.order.orderNumber}<br/>
        Issue Date: ${new Date(invoice.issueDate).toLocaleString()}<br/>
        Payment Status: ${invoice.paymentStatus}<br/>
        Shipment Status: ${workflow.shipment?.status ?? 'pending'}
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:10px;border-bottom:2px solid #333;">Item</th>
        <th style="text-align:right;padding:10px;border-bottom:2px solid #333;">Qty</th>
        <th style="text-align:right;padding:10px;border-bottom:2px solid #333;">Rate</th>
        <th style="text-align:right;padding:10px;border-bottom:2px solid #333;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
    <div><span>Shipping</span><span>${invoice.shippingAmount.toFixed(2)}</span></div>
    <div><span>Handling</span><span>${invoice.handlingAmount.toFixed(2)}</span></div>
    <div class="total"><span>Total</span><span>${invoice.totalAmount.toFixed(2)} ${invoice.currency}</span></div>
  </div>
</body>
</html>`

    return {
      fileName: `${invoice.invoiceNumber}.html`,
      mediaType: 'text/html' as const,
      html,
    }
  }

  private async postAccountingForOrder(orderId: string, mode: 'captured' | 'receivable') {
    const workflow = await this.getWorkflow(orderId)
    if (!workflow.invoice) {
      return
    }

    const existing = await db.first<IdRow>(
      `SELECT id FROM ${commerceTableNames.vouchers} WHERE source_type = 'storefront_order' AND source_id = ? LIMIT 1`,
      [orderId],
    )
    if (existing) {
      return
    }

    const voucherId = randomUUID()
    const voucherNumber = createSequence('JV')
    const now = new Date()
    const extraIncome = workflow.invoice.shippingAmount + workflow.invoice.handlingAmount
    const lines = [
      {
        id: randomUUID(),
        voucherId,
        ledgerCode: mode === 'captured' ? 'BANK_GATEWAY_CLEARING' : 'ACCOUNTS_RECEIVABLE',
        ledgerName: mode === 'captured' ? 'Bank / Gateway Clearing' : 'Accounts Receivable',
        debitAmount: workflow.invoice.totalAmount,
        creditAmount: 0,
        narration: `Storefront order ${workflow.order.orderNumber}`,
      },
      {
        id: randomUUID(),
        voucherId,
        ledgerCode: 'SALES_REVENUE',
        ledgerName: 'Sales Revenue',
        debitAmount: 0,
        creditAmount: workflow.invoice.subtotal,
        narration: `Merchandise value for ${workflow.order.orderNumber}`,
      },
      ...(extraIncome > 0 ? [{
        id: randomUUID(),
        voucherId,
        ledgerCode: 'SHIPPING_HANDLING_INCOME',
        ledgerName: 'Shipping And Handling Income',
        debitAmount: 0,
        creditAmount: extraIncome,
        narration: `Charges for ${workflow.order.orderNumber}`,
      }] : []),
    ]

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `INSERT INTO ${commerceTableNames.vouchers} (id, source_type, source_id, voucher_type, voucher_number, posting_date, effective_date, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [voucherId, 'storefront_order', orderId, mode === 'captured' ? 'sales_receipt' : 'sales_invoice', voucherNumber, now, now, `Accounting generated from storefront order ${workflow.order.orderNumber}.`],
      )

      for (const line of lines) {
        await transaction.execute(
          `INSERT INTO ${commerceTableNames.voucherLines} (id, voucher_id, ledger_code, ledger_name, debit_amount, credit_amount, narration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [line.id, line.voucherId, line.ledgerCode, line.ledgerName, line.debitAmount, line.creditAmount, line.narration],
        )
      }

      await this.insertOrderEvent(transaction.execute.bind(transaction), {
        orderId,
        eventType: 'accounting_posted',
        title: 'Accounting posted',
        description: 'Voucher lines were posted for this order.',
        statusAfter: workflow.order.status as CommerceOrderStatus,
        occurredAt: now,
        metadata: { voucherNumber },
      })
    })
  }

  private async insertOrderEvent(
    execute: (sql: string, params?: Array<string | number | Date | null>) => Promise<ResultSetHeader>,
    input: {
      orderId: string
      eventType: CommerceOrderEventType
      title: string
      description: string | null
      statusAfter: CommerceOrderStatus
      occurredAt: Date
      metadata?: Record<string, JsonPrimitive>
    },
  ) {
    await execute(
      `INSERT INTO ${commerceTableNames.orderEvents} (id, order_id, event_type, title, description, status_after, metadata_json, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), input.orderId, input.eventType, input.title, input.description, input.statusAfter, JSON.stringify(input.metadata ?? {}), input.occurredAt],
    )
  }

  private async insertShipmentEvent(
    execute: (sql: string, params?: Array<string | number | Date | null>) => Promise<ResultSetHeader>,
    input: {
      shipmentId: string
      orderId: string
      eventType: CommerceOrderEventType
      title: string
      description: string | null
      locationName?: string | null
      eventTime: Date
      metadata?: Record<string, JsonPrimitive>
    },
  ) {
    await execute(
      `INSERT INTO ${commerceTableNames.shipmentEvents} (id, shipment_id, order_id, event_type, title, description, location_name, event_time, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), input.shipmentId, input.orderId, input.eventType, input.title, input.description, input.locationName ?? null, input.eventTime, JSON.stringify(input.metadata ?? {})],
    )
  }

  private defaultTitleForEvent(eventType: CommerceOrderEventType) {
    switch (eventType) {
      case 'prepare_delivery': return 'Preparing for delivery'
      case 'packed': return 'Packed for dispatch'
      case 'courier_assigned': return 'Courier connected'
      case 'picked_up': return 'Courier picked up parcel'
      case 'estimated_delivery_updated': return 'Estimated delivery updated'
      case 'tracking_updated': return 'Tracking updated'
      case 'in_transit': return 'Parcel in transit'
      case 'out_for_delivery': return 'Parcel out for delivery'
      case 'delivered': return 'Parcel delivered'
      case 'delivery_confirmed': return 'Customer delivery confirmation received'
      case 'cancelled': return 'Order cancelled'
      default: return eventType
    }
  }
}
