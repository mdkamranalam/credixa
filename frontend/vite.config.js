import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const securityHeaders = () => {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: http://localhost:3000; connect-src 'self' http://localhost:* ws://localhost:*; font-src 'self' data: https://fonts.gstatic.com;");
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: http://localhost:3000; connect-src 'self' http://localhost:* ws://localhost:*; font-src 'self' data: https://fonts.gstatic.com;");
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), securityHeaders()],
  server: {
    port: 5173,
    host: true
  }
})

