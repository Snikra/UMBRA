import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

let port = 5173

try {
  const config = readFileSync('vite.config.js', 'utf-8')
  const match = config.match(/port:\s*(\d+)/)
  if (match) port = parseInt(match[1])
} catch {}

const url = `https://localhost:${port}`
console.log(`\n  🚇  Iniciando Cloudflare Tunnel para ${url}\n`)

try {
  execSync(`cloudflared tunnel --url ${url}`, { stdio: 'inherit', shell: true })
} catch {
  console.error(
    '\nCloudflare Tunnel falhou. Certifique-se de que o cloudflared está instalado:\n' +
    '  winget install cloudflare.cloudflared\n'
  )
  process.exit(1)
}
