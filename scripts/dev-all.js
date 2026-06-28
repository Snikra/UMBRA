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

console.log('\n  🚀  Iniciando UMBRA — Vite + Cloudflare Tunnel\n')

const vite = spawn('vite', ['--host'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
})

let vitePort = null
let viteBuffer = ''

vite.stdout.on('data', (data) => {
  const text = data.toString()
  viteBuffer += text
  process.stdout.write(text)

  if (!vitePort) {
    const match = viteBuffer.match(/Local:\s+https?:\/\/localhost:(\d+)/)
    if (match) {
      vitePort = parseInt(match[1])
      startTunnel(vitePort)
    }
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
    console.log('\n  ⚠️  Cloudflare Tunnel não encontrado.\n  Para instalar: winget install cloudflare.cloudflared\n')
    return
  }

  const url = `https://localhost:${port}`
  console.log(`\n  🚇  Iniciando Cloudflare Tunnel para ${url}\n`)

  const tunnel = spawn(cloudflared, ['tunnel', '--url', url], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  })

  let tunnelBuffer = ''

  tunnel.stdout.on('data', (data) => {
    const text = data.toString()
    tunnelBuffer += text
    process.stdout.write(text)

    const match = tunnelBuffer.match(
      /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
    )
    if (match) {
      console.log(`\n  ┌──────────────────────────────────────────────────────────┐`)
      console.log(`  │  🌍  URL PÚBLICA:  ${match[0]}  │`)
      console.log(`  │  Acesse de qualquer lugar com este link                  │`)
      console.log(`  └──────────────────────────────────────────────────────────┘\n`)
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
