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
    console.log('\n  ⚠️  Cloudflare Tunnel não instalado. Acesse apenas pela rede local.\n  Instale com: winget install cloudflare.cloudflared\n')
    return
  }

  const url = `https://localhost:${port}`
  console.log(`\n  🚇  Conectando ao Cloudflare... (aguarde alguns segundos)\n`)

  const tunnel = spawn(cloudflared, ['tunnel', '--url', url], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  })

  const urlPattern = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
  let urlFound = false

  function checkOutput(text) {
    if (urlFound) return
    const match = text.match(urlPattern)
    if (match) {
      urlFound = true
      console.log(`\n  ╔══════════════════════════════════════════════════════════╗`)
      console.log(`  ║                                                          ║`)
      console.log(`  ║     🌍  URL PÚBLICA                                     ║`)
      console.log(`  ║                                                          ║`)
      console.log(`  ║     ${match[0]}    ║`)
      console.log(`  ║                                                          ║`)
      console.log(`  ║  Acesse de qualquer lugar com este link                  ║`)
      console.log(`  ║  Compartilhe com quem estiver em outra rede              ║`)
      console.log(`  ║                                                          ║`)
      console.log(`  ╚══════════════════════════════════════════════════════════╝\n`)
    }
  }

  tunnel.stdout.on('data', (data) => {
    checkOutput(data.toString())
  })

  tunnel.stderr.on('data', (data) => {
    checkOutput(data.toString())
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
