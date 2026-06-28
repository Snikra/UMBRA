import { execSync } from 'node:child_process'
import { networkInterfaces } from 'node:os'
import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'

function findMkcert() {
  if (process.env.MKCERT) return process.env.MKCERT
  try {
    execSync('mkcert --version', { stdio: 'pipe' })
    return 'mkcert'
  } catch {
    const winGetPath = `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\FiloSottile.mkcert_Microsoft.Winget.Source_8wekyb3d8bbwe\\mkcert.exe`
    if (existsSync(winGetPath)) return winGetPath
    const userHome = `${homedir()}\\go\\bin\\mkcert.exe`
    if (existsSync(userHome)) return userHome
    return null
  }
}

const nets = networkInterfaces()
const localIp = Object.values(nets).flat().find(
  n => n.family === 'IPv4' && !n.internal
)?.address

if (!localIp) {
  console.error('Nenhum IP de rede local encontrado.')
  process.exit(1)
}

if (!existsSync('certs')) mkdirSync('certs')

const mkcert = findMkcert()
if (!mkcert) {
  console.error(
    'mkcert não encontrado. Instale com:\n' +
    '  winget install mkcert\n' +
    'Ou defina o caminho: $env:MKCERT="C:\\caminho\\para\\mkcert.exe"'
  )
  process.exit(1)
}

const cmd = `"${mkcert}" -install 2>&1 && "${mkcert}" -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1 ${localIp} ::1`

try {
  execSync(cmd, { stdio: 'inherit', shell: true })
  console.log(`\nCertificados gerados para: localhost, 127.0.0.1, ${localIp}`)
} catch {
  console.error('Falha ao gerar certificados.')
  process.exit(1)
}
