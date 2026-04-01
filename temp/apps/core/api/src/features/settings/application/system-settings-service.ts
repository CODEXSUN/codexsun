import { spawn } from 'node:child_process'
import {
  systemEnvironmentResponseSchema,
  systemEnvironmentUpdatePayloadSchema,
  systemSettingsResponseSchema,
  systemSettingsSchema,
  systemSettingsUpdatePayloadSchema,
  systemUpdateRunPayloadSchema,
  systemUpdateRunResponseSchema,
  type AuthUser,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import {
  environment,
  managedEnvironmentKeys,
  readManagedEnvironmentValues,
  reloadEnvironment,
  updateEnvironmentFile,
} from '@framework-core/runtime/config/environment'

let restartScheduled = false

function assertSuperAdmin(user: AuthUser) {
  if (!user.isSuperAdmin) {
    throw new ApplicationError('Super admin access is required.', {}, 403)
  }
}

function getSystemSettings() {
  return systemSettingsSchema.parse({
    frontendTarget: environment.frontend.target,
    sourceMode: environment.runtime.git.syncEnabled ? 'git' : 'embedded',
    update: {
      gitSyncEnabled: environment.runtime.git.syncEnabled,
      autoUpdateOnStart: environment.runtime.git.autoUpdateOnStart,
      forceUpdateOnStart: environment.runtime.git.forceUpdateOnStart,
      repositoryUrl: environment.runtime.git.repositoryUrl,
      branch: environment.runtime.git.branch,
    },
  })
}

function getSystemEnvironment() {
  return systemEnvironmentResponseSchema.parse({
    environment: {
      values: readManagedEnvironmentValues(),
      sourceMode: environment.runtime.git.syncEnabled ? 'git' : 'embedded',
      forceUpdatePending: environment.runtime.git.forceUpdateOnStart,
    },
  })
}

function assertManagedEnvironmentKeys(values: Record<string, string>) {
  const allowedKeys = new Set<string>(managedEnvironmentKeys)
  const invalidKeys = Object.keys(values).filter((key) => !allowedKeys.has(key))

  if (invalidKeys.length > 0) {
    throw new ApplicationError(
      'Unsupported environment keys were submitted.',
      { invalidKeys: invalidKeys.join(', ') },
      400,
    )
  }
}

function scheduleRestart() {
  if (restartScheduled) {
    throw new ApplicationError('An update restart is already scheduled.', {}, 409)
  }

  if (process.platform !== 'linux') {
    throw new ApplicationError(
      'Manual update restart is supported only for the Linux container deployment path.',
      { platform: process.platform },
      501,
    )
  }

  restartScheduled = true
  setTimeout(() => {
    const restartProcess = spawn('sh', ['-lc', 'sleep 1; kill -TERM 1'], {
      detached: true,
      stdio: 'ignore',
    })
    restartProcess.unref()
  }, 50)
}

export function readSystemSettings(user: AuthUser) {
  assertSuperAdmin(user)

  return systemSettingsResponseSchema.parse({
    settings: getSystemSettings(),
  })
}

export function readSystemEnvironment(user: AuthUser) {
  assertSuperAdmin(user)
  return getSystemEnvironment()
}

export function saveSystemSettings(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = systemSettingsUpdatePayloadSchema.parse(payload)
  updateEnvironmentFile({
    APP_MODE: parsedPayload.frontendTarget,
    VITE_FRONTEND_TARGET: parsedPayload.frontendTarget,
    GIT_SYNC_ENABLED: String(parsedPayload.update.gitSyncEnabled),
    GIT_AUTO_UPDATE_ON_START: String(parsedPayload.update.autoUpdateOnStart),
    GIT_REPOSITORY_URL: parsedPayload.update.repositoryUrl,
    GIT_BRANCH: parsedPayload.update.branch,
  })
  reloadEnvironment()

  return systemSettingsResponseSchema.parse({
    settings: getSystemSettings(),
  })
}

export function saveSystemEnvironment(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = systemEnvironmentUpdatePayloadSchema.parse(payload)
  assertManagedEnvironmentKeys(parsedPayload.values)
  updateEnvironmentFile(parsedPayload.values)
  reloadEnvironment()

  return getSystemEnvironment()
}

export function runManualUpdate(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = systemUpdateRunPayloadSchema.parse(payload)
  updateEnvironmentFile({
    APP_MODE: parsedPayload.frontendTarget,
    VITE_FRONTEND_TARGET: parsedPayload.frontendTarget,
    GIT_SYNC_ENABLED: 'true',
    GIT_AUTO_UPDATE_ON_START: String(parsedPayload.update.autoUpdateOnStart),
    GIT_FORCE_UPDATE_ON_START: 'true',
    GIT_REPOSITORY_URL: parsedPayload.update.repositoryUrl,
    GIT_BRANCH: parsedPayload.update.branch,
  })
  reloadEnvironment()
  scheduleRestart()

  return systemUpdateRunResponseSchema.parse({
    message: 'Update scheduled. The container will restart and rebuild from the configured Git source.',
    restartScheduled: true,
  })
}

export function saveSystemEnvironmentAndUpdate(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = systemEnvironmentUpdatePayloadSchema.parse(payload)
  assertManagedEnvironmentKeys(parsedPayload.values)
  updateEnvironmentFile({
    ...parsedPayload.values,
    GIT_FORCE_UPDATE_ON_START: 'true',
  })
  reloadEnvironment()
  scheduleRestart()

  return systemUpdateRunResponseSchema.parse({
    message: 'Environment saved. The container will restart and apply the updated runtime configuration.',
    restartScheduled: true,
  })
}
