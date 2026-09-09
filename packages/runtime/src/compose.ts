import type { DeploymentPlan, PlannedComponent } from './planner.js'

export function renderDockerCompose(plan: DeploymentPlan): string {
  const lines = [`name: codexsun-${plan.profile.id}`, 'services:']
  for (const component of plan.components) {
    const addons = plan.addons
      .filter(({ componentIds }) => componentIds.includes(component.id))
      .map(({ id }) => id)
    lines.push(...renderService(plan.profile.id, plan.profile.environment, component, addons))
  }
  const volumes = new Set(['codexsun-storage'])
  for (const component of plan.components) {
    for (const volume of component.volumes) volumes.add(volume.name)
  }
  lines.push('volumes:', ...[...volumes].map((name) => `  ${name}:`))
  return `${lines.join('\n')}\n`
}

function renderService(
  profileId: string,
  profileEnvironment: 'development' | 'production',
  component: PlannedComponent,
  addons: readonly string[],
): string[] {
  const dockerfile =
    component.dockerfile ??
    (component.runtime === 'node'
      ? '.container/docker/Dockerfile.node'
      : '.container/docker/Dockerfile.static')
  const lines = [
    `  ${component.id}:`,
    '    build:',
    '      context: ../../..',
    `      dockerfile: ${dockerfile}`,
    '      args:',
    `        COMPONENT_ID: ${component.id}`,
    `        PROFILE_ID: ${profileId}`,
    '    env_file:',
    '      - environment.env',
    '    environment:',
    `      ${component.portEnvironmentKey}: ${component.port}`,
  ]

  for (const [key, value] of Object.entries(component.environment))
    lines.push(`      ${key}: ${value}`)
  if (component.hostEnvironmentKey) lines.push(`      ${component.hostEnvironmentKey}: 0.0.0.0`)
  if (component.runtime === 'static') lines.push(`      PORT: ${component.port}`)
  if (component.runtime === 'node') {
    lines.push(`      APP_ENV: ${profileEnvironment}`)
    if (profileEnvironment === 'production') lines.push('      LOG_PRETTY: "false"')
  }
  if (addons.length > 0) lines.push(`      CODEXSUN_ADDONS: ${addons.join(',')}`)
  if (component.security === 'strict') {
    lines.push(
      '    init: true',
      '    read_only: true',
      '    cap_drop:',
      '      - ALL',
      '    security_opt:',
      '      - no-new-privileges:true',
      '    tmpfs:',
      '      - /tmp:rw,nosuid,size=256m',
    )
  }
  lines.push('    ports:', `      - "${component.port}:${component.port}"`)

  if (component.dependsOn.length > 0) {
    lines.push('    depends_on:', ...component.dependsOn.map((id) => `      - ${id}`))
  }
  if (component.runtime === 'node') {
    lines.push('    volumes:', '      - codexsun-storage:/app/storage/app')
    for (const volume of component.volumes) {
      const suffix = volume.readOnly ? ':ro' : ''
      lines.push(`      - ${volume.name}:${volume.containerPath}${suffix}`)
    }
  }
  return lines
}
