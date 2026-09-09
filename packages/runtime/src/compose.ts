import type { DeploymentPlan, PlannedComponent } from './planner.js'

export function renderDockerCompose(plan: DeploymentPlan): string {
  const lines = [`name: codexsun-${plan.profile.id}`, 'services:']
  for (const component of plan.components) {
    const addons = plan.addons
      .filter(({ componentIds }) => componentIds.includes(component.id))
      .map(({ id }) => id)
    lines.push(...renderService(plan.profile.id, plan.profile.environment, component, addons))
  }
  lines.push('volumes:', '  codexsun-storage:')
  return `${lines.join('\n')}\n`
}

function renderService(
  profileId: string,
  profileEnvironment: 'development' | 'production',
  component: PlannedComponent,
  addons: readonly string[],
): string[] {
  const dockerfile =
    component.runtime === 'node'
      ? '.container/docker/Dockerfile.node'
      : '.container/docker/Dockerfile.static'
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

  if (component.hostEnvironmentKey) lines.push(`      ${component.hostEnvironmentKey}: 0.0.0.0`)
  if (component.runtime === 'static') lines.push(`      PORT: ${component.port}`)
  if (component.runtime === 'node') {
    lines.push(`      APP_ENV: ${profileEnvironment}`)
    if (profileEnvironment === 'production') lines.push('      LOG_PRETTY: "false"')
  }
  if (addons.length > 0) lines.push(`      CODEXSUN_ADDONS: ${addons.join(',')}`)
  lines.push('    ports:', `      - "${component.port}:${component.port}"`)

  if (component.dependsOn.length > 0) {
    lines.push('    depends_on:', ...component.dependsOn.map((id) => `      - ${id}`))
  }
  if (component.runtime === 'node') {
    lines.push('    volumes:', '      - codexsun-storage:/app/storage/app')
  }
  return lines
}
