import { readFileSync, existsSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'

const hasCerts = existsSync('certs/cert.pem') && existsSync('certs/key.pem')

export default defineConfig({
  plugins: [react(), qrcode()],
  server: {
    host: true,
    port: 5173,
    https: hasCerts ? {
      cert: readFileSync('certs/cert.pem'),
      key: readFileSync('certs/key.pem'),
    } : false,
  },
})
