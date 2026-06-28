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
  execSync('netstat -ano | findstr ":5173 "', { stdio: 'pipe' })
    .toString()
    .split('\n')
    .forEach(line => {
      const parts = line.trim().split(/\s+/)
      const pid = parts[parts.length - 1]
      if (pid && pid !== '0') {
        try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' }) } catch {}
      }
    })
} catch {}

console.log('\n  🚀  Iniciando UMBRA — Vite + Cloudflare Tunnel\n')

const vite = spawn('vite', ['--host'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
})

vite.stdout.on('data', (data) => {
  process.stdout.write(data)
})

vite.stderr.on('data', (data) => {
  process.stderr.write(data)
})

vite.on('exit', (code) => {
  process.exit(code)
})

setTimeout(() => {
  const cloudflared = findCloudflared()
  if (!cloudflared) {
    console.log('\n  ⚠️  Cloudflare Tunnel não instalado.\n  Instale com: winget install cloudflare.cloudflared\n')
    return
  }

  console.log(`\n  🚇  Conectando ao Cloudflare... (aguarde alguns segundos)\n`)

  const tunnel = spawn(cloudflared, ['tunnel', '--url', 'https://localhost:5173'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  })

  const urlPattern = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/
  let urlFound = false

  function checkOutput(data) {
    if (urlFound) return
    const text = data.toString()
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
      console.log(`  Pressione Ctrl+C para parar tudo.\n`)
    }
  }

  tunnel.stdout.on('data', checkOutput)
  tunnel.stderr.on('data', checkOutput)

  tunnel.on('exit', () => {
    vite.kill()
    process.exit()
  })

  process.on('SIGINT', () => {
    tunnel.kill()
    vite.kill()
    process.exit()
  })
}, 2000)
