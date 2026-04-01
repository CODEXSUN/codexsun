import type { StorefrontOrder, CommerceShipment } from '@shared/index'
import { sendSmtpMail } from '@framework-core/runtime/notifications/smtp-mailer'
import { environment } from '@framework-core/runtime/config/environment'

export class CommerceNotificationService {
  constructor(
    private readonly sendMail = sendSmtpMail
  ) {}

  private getBaseLayout(content: string) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6366f1; margin: 0; font-size: 24px;">codexsun</h2>
          <p style="font-size: 14px; color: #6b7280; margin-top: 4px;">Premium Storefront Experience</p>
        </div>
        ${content}
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          <p>&copy; ${new Date().getFullYear()} ${environment.notifications.email.fromName}. All rights reserved.</p>
          <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
      </div>
    `
  }

  private formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  private getOrderTable(order: StorefrontOrder) {
    const rows = order.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <div style="font-weight: 500;">${item.productName}</div>
          <div style="font-size: 12px; color: #6b7280;">${item.size} / ${item.color} x ${item.quantity}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">
          ${this.formatCurrency(item.lineTotal, order.currency)}
        </td>
      </tr>
    `).join('')

    return `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr>
            <th style="text-align: left; font-size: 12px; text-transform: uppercase; color: #9ca3af; padding-bottom: 8px;">Item</th>
            <th style="text-align: right; font-size: 12px; text-transform: uppercase; color: #9ca3af; padding-bottom: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding-top: 16px; font-size: 14px; color: #6b7280;">Subtotal</td>
            <td style="padding-top: 16px; text-align: right; font-size: 14px; color: #6b7280;">${this.formatCurrency(order.subtotal, order.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 14px; color: #6b7280;">Shipping</td>
            <td style="padding: 4px 0; text-align: right; font-size: 14px; color: #6b7280;">${this.formatCurrency(order.shippingAmount, order.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 14px; color: #6b7280;">Handling</td>
            <td style="padding: 4px 0; text-align: right; font-size: 14px; color: #6b7280;">${this.formatCurrency(order.handlingAmount, order.currency)}</td>
          </tr>
          <tr>
            <td style="padding-top: 12px; font-weight: 700; font-size: 18px;">Total</td>
            <td style="padding-top: 12px; text-align: right; font-weight: 700; font-size: 18px; color: #6366f1;">${this.formatCurrency(order.totalAmount, order.currency)}</td>
          </tr>
        </tfoot>
      </table>
    `
  }

  async sendOrderReceivedEmail(order: StorefrontOrder) {
    console.log(`[Notification] Sending Order Received email to ${order.email} for ${order.orderNumber}`)
    
    const content = `
      <h3 style="margin-top: 0;">Order Received!</h3>
      <p>Hi ${order.firstName},</p>
      <p>Thank you for shopping with us. We've received your order <strong>${order.orderNumber}</strong> and it's currently being processed.</p>
      ${this.getOrderTable(order)}
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px; font-weight: 600;">Delivery Address:</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #4b5563;">
          ${order.addressLine1}${order.addressLine2 ? ', ' + order.addressLine2 : ''}<br/>
          ${order.city}, ${order.state} ${order.postalCode}<br/>
          ${order.country}
        </p>
      </div>
    `

    await this.sendMail({
      to: [{ email: order.email, name: `${order.firstName} ${order.lastName}` }],
      subject: `Order Received: ${order.orderNumber}`,
      html: this.getBaseLayout(content),
    }).catch(err => console.error(`[Notification] Failed to send email: ${err.message}`))
  }

  async sendOrderConfirmedEmail(order: StorefrontOrder) {
    console.log(`[Notification] Sending Order Confirmed email to ${order.email} for ${order.orderNumber}`)

    const content = `
      <h3 style="margin-top: 0; color: #10b981;">Order Confirmed!</h3>
      <p>Hi ${order.firstName},</p>
      <p>Great news! Your payment for order <strong>${order.orderNumber}</strong> has been confirmed. Our team is now preparing your items for dispatch.</p>
      ${this.getOrderTable(order)}
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">We'll notify you as soon as your order is shipped.</p>
    `

    await this.sendMail({
      to: [{ email: order.email, name: `${order.firstName} ${order.lastName}` }],
      subject: `Order Confirmed: ${order.orderNumber}`,
      html: this.getBaseLayout(content),
    }).catch(err => console.error(`[Notification] Failed to send email: ${err.message}`))
  }

  async sendOrderShippedEmail(order: StorefrontOrder, shipment: CommerceShipment) {
    console.log(`[Notification] Sending Order Shipped email to ${order.email} for ${order.orderNumber}`)

    const trackingLink = shipment.trackingUrl 
      ? `<a href="${shipment.trackingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 10px;">Track Order</a>`
      : ''

    const content = `
      <h3 style="margin-top: 0;">Your Order is Shipped!</h3>
      <p>Hi ${order.firstName},</p>
      <p>Your order <strong>${order.orderNumber}</strong> is on its way!</p>
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Courier: <strong>${shipment.courierName || 'Standard'}</strong></p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Tracking Number: <strong>${shipment.trackingNumber || 'N/A'}</strong></p>
        ${trackingLink}
      </div>
      ${this.getOrderTable(order)}
    `

    await this.sendMail({
      to: [{ email: order.email, name: `${order.firstName} ${order.lastName}` }],
      subject: `Order Shipped: ${order.orderNumber}`,
      html: this.getBaseLayout(content),
    }).catch(err => console.error(`[Notification] Failed to send email: ${err.message}`))
  }

  async sendOrderDeliveredEmail(order: StorefrontOrder) {
    console.log(`[Notification] Sending Order Delivered email to ${order.email} for ${order.orderNumber}`)

    const content = `
      <h3 style="margin-top: 0; color: #10b981;">Delivered!</h3>
      <p>Hi ${order.firstName},</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been successfully delivered. We hope you love your new purchase!</p>
      ${this.getOrderTable(order)}
      <p style="margin-top: 24px;">How was your experience? If you have any questions, simply reply to this email.</p>
    `

    await this.sendMail({
      to: [{ email: order.email, name: `${order.firstName} ${order.lastName}` }],
      subject: `Order Delivered: ${order.orderNumber}`,
      html: this.getBaseLayout(content),
    }).catch(err => console.error(`[Notification] Failed to send email: ${err.message}`))
  }

  async sendOrderCancelledEmail(order: StorefrontOrder, reason?: string) {
    console.log(`[Notification] Sending Order Cancelled email to ${order.email} for ${order.orderNumber}`)

    const content = `
      <h3 style="margin-top: 0; color: #ef4444;">Order Cancelled</h3>
      <p>Hi ${order.firstName},</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
      ${reason ? `<p style="font-style: italic; color: #6b7280;">Reason: ${reason}</p>` : ''}
      <p>If this was unexpected or if you have any questions regarding your refund, please contact our support team.</p>
      ${this.getOrderTable(order)}
    `

    await this.sendMail({
      to: [{ email: order.email, name: `${order.firstName} ${order.lastName}` }],
      subject: `Order Cancelled: ${order.orderNumber}`,
      html: this.getBaseLayout(content),
    }).catch(err => console.error(`[Notification] Failed to send email: ${err.message}`))
  }
}
