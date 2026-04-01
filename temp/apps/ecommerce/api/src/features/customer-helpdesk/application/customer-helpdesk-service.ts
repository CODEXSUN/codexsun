import type {
  AuthAccountRecoveryRequestResponse,
  AuthPasswordResetRequestResponse,
  AuthUser,
  CustomerHelpdeskDetail,
  CustomerHelpdeskDetailResponse,
  CustomerHelpdeskIssue,
  CustomerHelpdeskListResponse,
} from '@shared/index'
import {
  customerHelpdeskDetailResponseSchema,
  customerHelpdeskListResponseSchema,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import type { AuthService } from '@framework-core/auth/application/auth-service'
import type { CustomerProfileRepository } from '../../customer-profile/data/customer-profile-repository'
import type { CustomerHelpdeskRepository } from '../data/customer-helpdesk-repository'

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function buildIssues(input: {
  isActive: boolean
  purgeAfterAt: string | null
  phoneNumber: string | null
  addressesCount: number
  ordersCount: number
  latestOrder: CustomerHelpdeskDetail['orders'][number] | null
  defaultAddress: CustomerHelpdeskDetail['addresses'][number] | null
  profileDisplayName: string
  profilePhoneNumber: string | null
}) {
  const issues: CustomerHelpdeskIssue[] = []

  if (!input.isActive) {
    issues.push({
      code: 'account-disabled',
      severity: 'critical',
      title: 'Account is disabled',
      description: input.purgeAfterAt
        ? `Customer account is disabled and remains recoverable until ${new Date(input.purgeAfterAt).toLocaleString()}.`
        : 'Customer account is disabled and requires support-guided recovery.',
    })
  }

  if (!input.phoneNumber) {
    issues.push({
      code: 'missing-mobile',
      severity: 'warning',
      title: 'Mobile number missing',
      description: 'No primary mobile number is stored on the customer account.',
    })
  }

  if (input.addressesCount === 0) {
    issues.push({
      code: 'missing-address',
      severity: 'warning',
      title: 'No saved delivery address',
      description: 'The customer profile does not currently have a saved delivery address.',
    })
  }

  if (input.ordersCount === 0) {
    issues.push({
      code: 'no-orders',
      severity: 'info',
      title: 'No linked storefront orders',
      description: 'No storefront orders are currently linked to this customer email.',
    })
  }

  if (input.latestOrder && input.defaultAddress) {
    const addressMismatch =
      normalizeText(input.latestOrder.addressLine1) !== normalizeText(input.defaultAddress.addressLine1)
      || normalizeText(input.latestOrder.city) !== normalizeText(input.defaultAddress.city)
      || normalizeText(input.latestOrder.state) !== normalizeText(input.defaultAddress.state)
      || normalizeText(input.latestOrder.postalCode) !== normalizeText(input.defaultAddress.postalCode)

    if (addressMismatch) {
      issues.push({
        code: 'delivery-address-mismatch',
        severity: 'warning',
        title: 'Latest order delivery address differs',
        description: 'The latest order uses a delivery address that does not match the current default saved address.',
      })
    }

    const orderName = `${input.latestOrder.firstName} ${input.latestOrder.lastName}`.trim()
    if (normalizeText(orderName) !== normalizeText(input.profileDisplayName)) {
      issues.push({
        code: 'delivery-name-mismatch',
        severity: 'info',
        title: 'Delivery contact name differs',
        description: 'The latest order delivery name differs from the current account display name.',
      })
    }

    if (
      input.profilePhoneNumber
      && normalizeText(input.latestOrder.phone) !== normalizeText(input.profilePhoneNumber)
    ) {
      issues.push({
        code: 'delivery-phone-mismatch',
        severity: 'warning',
        title: 'Delivery phone differs',
        description: 'The latest order phone number differs from the account mobile number on file.',
      })
    }
  }

  return issues
}

export class CustomerHelpdeskService {
  constructor(
    private readonly repository: CustomerHelpdeskRepository,
    private readonly customerProfileRepository: CustomerProfileRepository,
    private readonly authService: AuthService,
  ) {}

  async listCustomers(user: AuthUser): Promise<CustomerHelpdeskListResponse> {
    this.assertBackofficeUser(user)
    const items = await this.repository.listCustomers()
    return customerHelpdeskListResponseSchema.parse({ items } satisfies CustomerHelpdeskListResponse)
  }

  async getCustomer(user: AuthUser, customerId: string): Promise<CustomerHelpdeskDetailResponse> {
    this.assertBackofficeUser(user)

    const customer = await this.repository.getCustomerById(customerId)
    const profile = await this.customerProfileRepository.getByUserId(customerId)
    const orders = await this.repository.listOrdersByCustomerEmail(customer.email)
    const verifications = await this.repository.listVerificationsForDestinations([
      customer.email,
      customer.phoneNumber ?? '',
    ])
    const defaultAddress = profile.addresses.find((address) => address.isDefault) ?? profile.addresses[0] ?? null
    const latestOrder = orders[0] ?? null

    const item = {
      customer: {
        ...customer,
        profile,
      },
      orders,
      addresses: profile.addresses,
      verifications,
      issues: buildIssues({
        isActive: customer.isActive,
        purgeAfterAt: customer.purgeAfterAt,
        phoneNumber: customer.phoneNumber,
        addressesCount: profile.addresses.length,
        ordersCount: orders.length,
        latestOrder,
        defaultAddress,
        profileDisplayName: profile.displayName,
        profilePhoneNumber: profile.phoneNumber,
      }),
    } satisfies CustomerHelpdeskDetail

    return customerHelpdeskDetailResponseSchema.parse({
      item,
    } satisfies CustomerHelpdeskDetailResponse)
  }

  async sendPasswordReset(user: AuthUser, customerId: string): Promise<AuthPasswordResetRequestResponse> {
    this.assertBackofficeUser(user)
    return this.authService.requestPasswordResetForCustomer(customerId)
  }

  async sendRecoveryEmail(user: AuthUser, customerId: string): Promise<AuthAccountRecoveryRequestResponse> {
    this.assertBackofficeUser(user)
    return this.authService.requestAccountRecoveryForCustomer(customerId)
  }

  private assertBackofficeUser(user: AuthUser) {
    if (user.actorType !== 'admin' && user.actorType !== 'staff') {
      throw new ApplicationError('Customer helpdesk is available only to internal users.', { actorType: user.actorType }, 403)
    }
  }
}
