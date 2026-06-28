import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { qrcode } from 'vite-plugin-qrcode'

export default defineConfig({
  plugins: [react(), basicSsl(), qrcode()],
  server: {
    host: true,
    https: true,
  },
})
