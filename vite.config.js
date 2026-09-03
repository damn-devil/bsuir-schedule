import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bsuir-schedule/',
  server: { port: 5174 },
  build: { target: 'es2017' },
})
