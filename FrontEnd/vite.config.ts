import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Bypass function: if the request is a browser page navigation (Accept: text/html),
// return index.html so React Router handles it. Otherwise proxy to backend.
const spaBypass = (req: { headers: Record<string, string | string[] | undefined> }) => {
  const accept = req.headers['accept'] ?? ''
  if (typeof accept === 'string' && accept.includes('text/html')) {
    return '/index.html'
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/stepups': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/categories': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/orders': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: spaBypass,
      },
      '/cart': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: spaBypass,
      },
      '/users': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
