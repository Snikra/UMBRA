import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { homedir } from 'node:os'

function findCloudflared() {
  try {
    execSync('cloudflared --version', { stdio: 'pipe' })
    return 'cloudflared'
  } catch {}
  const paths = [
    `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Cloudflare.cloudflared_Microsoft.WinGet.Source_8wekyb3d8bbwe\\cloudflared.exe`,
    `${process.env.LOCALAPPDATA}\\cloudflared\\cloudflared.exe`,
    `${homedir()}\\.cloudflared\\cloudflared.exe`,
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
  ]
  for (const p of paths) {
    if (existsSync(p)) return p
  }
  return null
}

let port = 5173
try {
  const config = readFileSync('vite.config.js', 'utf-8')
  const match = config.match(/port:\s*(\d+)/)
  if (match) port = parseInt(match[1])
} catch {}

const cloudflared = findCloudflared()
if (!cloudflared) {
  console.error(
    '\n  Cloudflare Tunnel não encontrado. Instale com:\n' +
    '    winget install cloudflare.cloudflared\n' +
    '  Depois reinicie o terminal.\n'
  )
  process.exit(1)
}

const url = `https://localhost:${port}`
console.log(`\n  🚇  Iniciando Cloudflare Tunnel para ${url}\n`)
execSync(`"${cloudflared}" tunnel --url ${url}`, { stdio: 'inherit', shell: true })
