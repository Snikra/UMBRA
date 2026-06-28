import { spawn, execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

function findCloudflared() {
  try {
    execSync('cloudflared --version', { stdio: 'pipe' })
    return 'cloudflared'
  } catch {}
  const paths = [
    `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Cloudflare.cloudflared_Microsoft.WinGet.Source_8wekyb3d8bbwe\\cloudflared.exe`,
  ]
  for (const p of paths) {
    if (existsSync(p)) return p
  }
  return null
}

try {
  execSync('taskkill /F /FI "PID ne 0" /FI "WINDOWTITLE ne ''" 2>nul | where /R "5173"', { stdio: 'pipe' })
} catch {}

console.log('\n  🚀  Iniciando UMBRA — Vite + Cloudflare Tunnel\n')

const vite = spawn('vite', ['--host'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
})

let vitePort = null
const viteOutput = []

vite.stdout.on('data', (data) => {
  const text = data.toString()
  viteOutput.push(text)
  process.stdout.write(text)

  const portMatch = text.match(/Local:\s+https?:\/\/localhost:(\d+)/)
  if (portMatch) {
    vitePort = parseInt(portMatch[1])
    startTunnel(vitePort)
  }
})

vite.stderr.on('data', (data) => {
  process.stderr.write(data.toString())
})

vite.on('exit', (code) => {
  process.exit(code)
})

function startTunnel(port) {
  const cloudflared = findCloudflared()
  if (!cloudflared) {
    console.log('\n  ⚠️  Cloudflare Tunnel não instalado. Acesse apenas pela rede local.\n')
    console.log('  Para instalar: winget install cloudflare.cloudflared\n')
    return
  }

  const url = `https://localhost:${port}`
  console.log(`\n  🚇  Iniciando Cloudflare Tunnel para ${url}\n`)

  const tunnel = spawn(cloudflared, ['tunnel', '--url', url], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  })

  tunnel.stdout.on('data', (data) => {
    const text = data.toString()
    process.stdout.write(text)

    const urlMatch = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
    if (urlMatch) {
      console.log(`\n  ┌──────────────────────────────────────────────────────┐`)
      console.log(`  │  🌍  URL PÚBLICA: ${urlMatch[0]}  │`)
      console.log(`  │  Compartilhe este link para acessar de qualquer lugar │`)
      console.log(`  └──────────────────────────────────────────────────────┘\n`)
    }
  })

  tunnel.stderr.on('data', (data) => {
    process.stderr.write(data.toString())
  })

  tunnel.on('exit', () => {
    vite.kill()
    process.exit()
  })

  process.on('SIGINT', () => {
    tunnel.kill()
    vite.kill()
    process.exit()
  })
}
