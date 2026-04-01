import { spawn } from 'node:child_process'

type CliCommand =
  | 'help'
  | 'apps'
  | 'doctor'
  | 'build'
  | 'start'

interface AppDescriptor {
  id: string
  summary: string
  devCommand?: string
  buildCommand?: string
  startCommand?: string
}

const appRegistry: AppDescriptor[] = [
  {
    id: 'framework',
    summary: 'Platform runtime services, auth, storage, and infrastructure helpers.',
  },
  {
    id: 'core',
    summary: 'Shared business masters and suite host runtime.',
    devCommand: 'npm run dev:api',
    buildCommand: 'npm run build:api',
    startCommand: 'npm run start:server',
  },
  {
    id: 'ecommerce',
    summary: 'Storefront, backoffice, checkout, and commerce UX.',
    devCommand: 'npm run dev:web',
    buildCommand: 'npm run build:web',
  },
  {
    id: 'billing',
    summary: 'Accounts, inventory, billing, and reporting application base.',
    devCommand: 'npm run dev:billing-api',
    buildCommand: 'npm run build:billing-api',
    startCommand: 'npm run start:billing-api',
  },
  {
    id: 'site',
    summary: 'Static presentation surface.',
  },
  {
    id: 'ui',
    summary: 'Reusable UI primitives.',
  },
  {
    id: 'docs',
    summary: 'Unified documentation surface for the whole suite.',
  },
  {
    id: 'cli',
    summary: 'Server-side operational control commands.',
    buildCommand: 'npm run build:cli',
  },
]

function printHelp() {
  console.log(`codexsun CLI

Usage:
  npm run cli -- help
  npm run cli -- apps
  npm run cli -- doctor
  npm run cli -- build all
  npm run cli -- build core
  npm run cli -- build ecommerce
  npm run cli -- build billing
  npm run cli -- start core
  npm run cli -- start billing
`)
}

function printApps() {
  console.log('codexsun app suite:\n')
  for (const app of appRegistry) {
    console.log(`- ${app.id}: ${app.summary}`)
  }
}

function printDoctor() {
  console.log('codexsun doctor\n')
  console.log(`node: ${process.version}`)
  console.log(`platform: ${process.platform}`)
  console.log(`cwd: ${process.cwd()}`)
  console.log(`DB_ENABLED: ${process.env.DB_ENABLED ?? '(unset)'}`)
  console.log(`DB_HOST: ${process.env.DB_HOST ?? '(unset)'}`)
  console.log(`DB_NAME: ${process.env.DB_NAME ?? '(unset)'}`)
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '(set)' : '(unset)'}`)
}

function resolveCommand(kind: 'build' | 'start', target: string | undefined) {
  if (!target) {
    throw new Error(`Missing target for "${kind}".`)
  }

  if (target === 'all') {
    if (kind !== 'build') {
      throw new Error(`"${kind} all" is not supported.`)
    }

    return 'npm run build'
  }

  const app = appRegistry.find((entry) => entry.id === target)
  if (!app) {
    throw new Error(`Unknown app target "${target}".`)
  }

  const command = kind === 'build' ? app.buildCommand : app.startCommand
  if (!command) {
    throw new Error(`No ${kind} command is defined for "${target}".`)
  }

  return command
}

async function runShellCommand(command: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Command failed with exit code ${code ?? 'unknown'}.`))
    })

    child.on('error', reject)
  })
}

async function main() {
  const [command = 'help', target] = process.argv.slice(2) as [CliCommand | undefined, string | undefined]

  switch (command) {
    case 'help':
      printHelp()
      return
    case 'apps':
      printApps()
      return
    case 'doctor':
      printDoctor()
      return
    case 'build':
      await runShellCommand(resolveCommand('build', target))
      return
    case 'start':
      await runShellCommand(resolveCommand('start', target))
      return
    default:
      printHelp()
      throw new Error(`Unknown command "${String(command)}".`)
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown CLI failure.'
  console.error(message)
  process.exit(1)
})
