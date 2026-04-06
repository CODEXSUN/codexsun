import type {
  MailboxMessageArchivePayload,
  MailboxMessageArchiveResponse,
  MailboxMessageDeletePayload,
  MailboxMessageDeleteResponse,
  MailboxMessageListResponse,
  MailboxMessageResponse,
  MailboxMessageRestoreResponse,
  MailboxSendPayload,
  MailboxTemplateListResponse,
  MailboxTemplateResponse,
  MailboxTemplateUpsertPayload,
} from "@cxapp/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

export async function listFrameworkMailboxMessages(options?: { archived?: boolean }) {
  const archived = options?.archived ? "true" : "false"
  return requestJson<MailboxMessageListResponse>(
    `/internal/v1/cxapp/mailbox/messages?archived=${archived}`
  )
}

export async function getFrameworkMailboxMessage(messageId: string) {
  return requestJson<MailboxMessageResponse>(
    `/internal/v1/cxapp/mailbox/message?id=${encodeURIComponent(messageId)}`
  )
}

export async function deleteFrameworkMailboxMessage(messageId: string) {
  return requestJson<MailboxMessageDeleteResponse>(
    `/internal/v1/cxapp/mailbox/message?id=${encodeURIComponent(messageId)}`,
    {
      method: "DELETE",
    }
  )
}

export async function deleteFrameworkMailboxMessages(payload: MailboxMessageDeletePayload) {
  return requestJson<MailboxMessageDeleteResponse>("/internal/v1/cxapp/mailbox/messages/delete", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function archiveFrameworkMailboxMessage(messageId: string) {
  return requestJson<MailboxMessageArchiveResponse>(
    `/internal/v1/cxapp/mailbox/message/archive?id=${encodeURIComponent(messageId)}`,
    {
      method: "POST",
    }
  )
}

export async function restoreFrameworkMailboxMessage(messageId: string) {
  return requestJson<MailboxMessageRestoreResponse>(
    `/internal/v1/cxapp/mailbox/message/restore?id=${encodeURIComponent(messageId)}`,
    {
      method: "POST",
    }
  )
}

export async function archiveFrameworkMailboxMessages(payload: MailboxMessageArchivePayload) {
  return requestJson<MailboxMessageArchiveResponse>("/internal/v1/cxapp/mailbox/messages/archive", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function restoreFrameworkMailboxMessages(payload: MailboxMessageArchivePayload) {
  return requestJson<MailboxMessageRestoreResponse>("/internal/v1/cxapp/mailbox/messages/restore", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function sendFrameworkMailboxMessage(payload: MailboxSendPayload) {
  return requestJson<MailboxMessageResponse>("/internal/v1/cxapp/mailbox/message/send", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function listFrameworkMailboxTemplates(includeInactive = true) {
  return requestJson<MailboxTemplateListResponse>(
    `/internal/v1/cxapp/mailbox/templates?includeInactive=${includeInactive ? "true" : "false"}`
  )
}

export async function getFrameworkMailboxTemplate(templateId: string) {
  return requestJson<MailboxTemplateResponse>(
    `/internal/v1/cxapp/mailbox/template?id=${encodeURIComponent(templateId)}`
  )
}

export async function createFrameworkMailboxTemplate(payload: MailboxTemplateUpsertPayload) {
  return requestJson<MailboxTemplateResponse>("/internal/v1/cxapp/mailbox/template", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateFrameworkMailboxTemplate(
  templateId: string,
  payload: MailboxTemplateUpsertPayload
) {
  return requestJson<MailboxTemplateResponse>(
    `/internal/v1/cxapp/mailbox/template?id=${encodeURIComponent(templateId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  )
}

export async function deactivateFrameworkMailboxTemplate(templateId: string) {
  return requestJson<MailboxTemplateResponse>(
    `/internal/v1/cxapp/mailbox/template?id=${encodeURIComponent(templateId)}`,
    {
      method: "DELETE",
    }
  )
}

export async function restoreFrameworkMailboxTemplate(templateId: string) {
  return requestJson<MailboxTemplateResponse>(
    `/internal/v1/cxapp/mailbox/template/restore?id=${encodeURIComponent(templateId)}`,
    {
      method: "POST",
    }
  )
}
